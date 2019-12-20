import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { MatDialogRef, MatDialog, MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";

@Component({
  selector: "app-registrar-asistencia",
  templateUrl: "./registrar-asistencia.component.html",
  styleUrls: ["./registrar-asistencia.component.css"]
})
export class RegistrarAsistenciaComponent implements OnInit {
  cursos: any[];
  cursoNotSelected: boolean;
  diaActual: string;
  estudiantesXDivision: any[];
  displayedColumns: string[] = ["apellido", "nombre", "accion"];
  fechaActual: Date;
  asistenciaNueva: string = "true";
  agent: any;
  fueraPeriodoCicloLectivo= false;

  constructor(
    private servicio: EstudiantesService,
    private autenticacionService: AutenticacionService,
    public popup: MatDialog,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.cursoNotSelected = true;
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

    if (this.fechaActualEnCicloLectivo() || this.autenticacionService.getRol()=="Admin") {
      this.servicio.obtenerCursos().subscribe(response => {
        this.cursos = response.cursos;
        this.cursos.sort((a, b) =>
          a.curso.charAt(0) > b.curso.charAt(0)
            ? 1
            : b.curso.charAt(0) > a.curso.charAt(0)
            ? -1
            : 0
        );
      });
    } else {
      this.fueraPeriodoCicloLectivo= true;
    }
  }

  //Devuelve true si la fecha actual se encuentra dentro del ciclo lectivo, y false caso contrario.
  fechaActualEnCicloLectivo() {
  let fechaInicioPrimerTrimestre = new Date(this.autenticacionService.getFechasCicloLectivo().fechaInicioPrimerTrimestre);
  let fechaFinTercerTrimestre = new Date(this.autenticacionService.getFechasCicloLectivo().fechaFinTercerTrimestre);

  return this.fechaActual.getTime() > fechaInicioPrimerTrimestre.getTime() &&
      this.fechaActual.getTime() < fechaFinTercerTrimestre.getTime();
  }

  //Busca los estudiantes segun el curso que se selecciono en pantalla. Los orden alfabeticamente
  onCursoSeleccionado(curso) {
    this.cursoNotSelected = false;
    this.servicio.cargarAsistencia(curso.value).subscribe(respuesta => {
      this.asistenciaNueva = respuesta.asistenciaNueva;
      this.estudiantesXDivision = respuesta.estudiantes.sort((a, b) =>
        a.apellido > b.apellido ? 1 : b.apellido > a.apellido ? -1 : 0
      );
    });
  }

  //Cambia el atributo presente del estudiante cuando se cambia de valor el toggle
  onCambioPresentismo(row) {
    const indexEstudiante = this.estudiantesXDivision.findIndex(
      objConIDEstudiante => objConIDEstudiante._id == row._id
    );
    this.estudiantesXDivision[indexEstudiante].presente = !this
      .estudiantesXDivision[indexEstudiante].presente;
  }

  //Envia al servicio el vector con los datos de los estudiantes y el presentismo
  onGuardar() {
    this.servicio
      .registrarAsistencia(this.estudiantesXDivision, this.asistenciaNueva)
      .subscribe(response => {
        this.snackBar.open(response.message, "", {
          panelClass: ["snack-bar-exito"],
          duration: 4500
        });
      });
  }

  onCancelar() {
    this.servicio.tipoPopUp = "cancelar";
    this.popup.open(AsistenciaPopupComponent, {
      width: "250px"
    });
  }
}

@Component({
  selector: "app-asistencia-popup",
  templateUrl: "./asistencia-popup.component.html",
  styleUrls: ["./registrar-asistencia.component.css"]
})
export class AsistenciaPopupComponent {
  tipoPopup: string;

  constructor(
    public dialogRef: MatDialogRef<AsistenciaPopupComponent>,
    public router: Router,
    public servicio: EstudiantesService
  ) {
    this.tipoPopup = this.servicio.tipoPopUp;
  }

  // Se cierra el popup
  onOkClick(): void {
    this.dialogRef.close();
  }

  onYesClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
