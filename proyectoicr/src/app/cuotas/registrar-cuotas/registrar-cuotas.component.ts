import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";

@Component({
  selector: "app-registrar-cuotas",
  templateUrl: "./registrar-cuotas.component.html",
  styleUrls: ["./registrar-cuotas.component.css"]
})
export class RegistrarCuotasComponent implements OnInit {
  constructor(
    public autenticacionService: AutenticacionService,
    public servicioEstudiante: EstudiantesService,
    public snackBar: MatSnackBar
  ) {}

  mesSeleccionado: any;
  fechaActual: Date;
  fueraPeriodoCicloLectivo: Boolean;
  cursos: any[];
  meses: string[] = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
  ];
  cursoNotSelected: Boolean = true;
  estudiantesXDivision: any[];
  displayedColumns: string[] = ["apellido", "nombre", "accion"];

  ngOnInit() {
    this.fechaActual = new Date();

    if (
      this.fechaActual.toString().substring(0, 3) == "Sat" ||
      this.fechaActual.toString().substring(0, 3) == "Sun"
    ) {
      this.snackBar.open(
        "Considere que está queriendo registrar una asistencia en un fin de semana",
        "",
        {
          panelClass: ["snack-bar-aviso"],
          duration: 8000
        }
      );
    }

    if (
      !this.fechaActualEnCicloLectivo() ||
      this.autenticacionService.getRol() != "Admin"
    ) {
      // this.fueraPeriodoCicloLectivo = true;
    }
  }

  //Busca los estudiantes segun el curso que se selecciono en pantalla. Los orden alfabeticamente
  onCursoSeleccionado(curso) {
    this.cursoNotSelected = false;
  }

  //Cambia el atributo presente del estudiante cuando se cambia de valor el toggle
  onCambioEstadoCuota(row) {
    const indexEstudiante = this.estudiantesXDivision.findIndex(
      objConIDEstudiante => objConIDEstudiante._id == row._id
    );
    this.estudiantesXDivision[indexEstudiante].presente = !this
      .estudiantesXDivision[indexEstudiante].presente;
  }

  //Devuelve true si la fecha actual se encuentra dentro del ciclo lectivo, y false caso contrario.
  fechaActualEnCicloLectivo() {
    let fechaInicioPrimerTrimestre = new Date(
      this.autenticacionService.getFechasCicloLectivo().fechaInicioPrimerTrimestre
    );
    let fechaFinTercerTrimestre = new Date(
      this.autenticacionService.getFechasCicloLectivo().fechaFinTercerTrimestre
    );

    return (
      this.fechaActual.getTime() > fechaInicioPrimerTrimestre.getTime() &&
      this.fechaActual.getTime() < fechaFinTercerTrimestre.getTime()
    );
  }

  onMesSeleccionado(mes) {
    this.mesSeleccionado = mes;
    this.servicioEstudiante.obtenerCursos().subscribe(response => {
      this.cursos = response.cursos;
      this.cursos.sort((a, b) =>
        a.curso.charAt(0) > b.curso.charAt(0)
          ? 1
          : b.curso.charAt(0) > a.curso.charAt(0)
          ? -1
          : 0
      );
    });
  }

  onGuardar() {}

  onCancelar() {}
}
