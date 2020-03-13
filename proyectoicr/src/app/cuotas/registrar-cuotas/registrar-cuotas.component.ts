import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { MatSnackBar, MatDialog } from "@angular/material";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { CuotasService } from "../cuotas.service";
import { CancelPopupComponent } from 'src/app/popup-genericos/cancel-popup.component';

@Component({
  selector: "app-registrar-cuotas",
  templateUrl: "./registrar-cuotas.component.html",
  styleUrls: ["./registrar-cuotas.component.css"]
})
export class RegistrarCuotasComponent implements OnInit {
  constructor(
    public autenticacionService: AutenticacionService,
    public servicioEstudiante: EstudiantesService,
    public cuotasService: CuotasService,
    public popup: MatDialog,
    public snackBar: MatSnackBar
  ) {}

  mesSeleccionado: any;
  fechaActual: Date;
  fueraPeriodoCicloLectivo: Boolean;
  cursos: any[];
  cursoEstudiante: any;
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
  cuotasXEstudiante: any[] = [];
  displayedColumns: string[] = ["apellido", "nombre", "accion"];

  ngOnInit() {
    this.fechaActual = new Date();

    if (
      this.fechaActual.toString().substring(0, 3) == "Sat" ||
      this.fechaActual.toString().substring(0, 3) == "Sun"
    ) {
      this.snackBar.open(
        "Considere que está queriendo registrar el estado de las cuotas en un fin de semana",
        "",
        {
          panelClass: ["snack-bar-aviso"],
          duration: 8000
        }
      );
    }

    // if (
    //   !this.fechaActualEnCicloLectivo() ||
    //   this.autenticacionService.getRol() != "Admin"
    // ) {
    //    this.fueraPeriodoCicloLectivo = true;
    // }
  }

  //Busca los estudiantes segun el curso que se selecciono en pantalla. Los orden alfabeticamente
  onCursoSeleccionado(curso, mes) {
    this.cursoNotSelected = false;
    let nroMes: any = 0;

    for (let i = 0; i < this.meses.length; i++) {
      if (mes.value == this.meses[i]) {
        nroMes = i + 1;
        break;
      }
    }
    this.cuotasService
      .obtenerEstadoCuotasDeCurso(curso.value, nroMes)
      .subscribe(rtdo => {
        this.cuotasXEstudiante = rtdo.cuotasXEstudiante.sort((a, b) =>
          a.apellido > b.apellido ? 1 : b.apellido > a.apellido ? -1 : 0
        );
      });
  }

  //Cambia el atributo presente del estudiante cuando se cambia de valor el toggle
  onCambioEstadoCuota(row) {
    const indexEstudiante = this.cuotasXEstudiante.findIndex(
      objConIDEstudiante => objConIDEstudiante._id == row._id
    );
    this.cuotasXEstudiante[indexEstudiante].pagado = !this.cuotasXEstudiante[
      indexEstudiante
    ].pagado;
    this.cuotasXEstudiante[indexEstudiante].changed = true;
  }

  //Devuelve true si la fecha actual se encuentra dentro del ciclo lectivo, y false caso contrario.
  // fechaActualEnCicloLectivo() {
  //   let fechaInicioPrimerTrimestre = new Date(
  //     this.autenticacionService.getFechasCicloLectivo().fechaInicioPrimerTrimestre
  //   );
  //   let fechaFinTercerTrimestre = new Date(
  //     this.autenticacionService.getFechasCicloLectivo().fechaFinTercerTrimestre
  //   );

  //   return (
  //     this.fechaActual.getTime() > fechaInicioPrimerTrimestre.getTime() &&
  //     this.fechaActual.getTime() < fechaFinTercerTrimestre.getTime()
  //   );
  // }

  //Al seleccionar el mes obtiene todos los cursos y los ordena alfabeticamente
  onMesSeleccionado(mes) {
    this.cursoNotSelected = true;
    this.mesSeleccionado = mes.value;
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
    this.cursoEstudiante = "";
  }

  onGuardar() {
    let cuotasCambiadas = [];
    this.cuotasXEstudiante.forEach(cuota => {
      if (cuota.changed == true) {
        cuotasCambiadas.push(cuota);
      }
    });
    this.cuotasService
      .publicarEstadoCuotasDeCurso(cuotasCambiadas)
      .subscribe(rtdo => {
        if (cuotasCambiadas.length == 0) {
          this.snackBar.open(
            "No se ha realizado ninguna modificación en las cuotas",
            "",
            {
              panelClass: ["snack-bar-fracaso"],
              duration: 3000
            }
          );
        } else {
          this.snackBar.open(rtdo.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 3000
          });
        }
      });
  }

  onCancelar() {
    this.servicioEstudiante.tipoPopUp = "cancelar";
    this.popup.open(CancelPopupComponent);
  }

}