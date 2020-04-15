import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import { MatDialogRef, MatDialog, MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-registrar-asistencia",
  templateUrl: "./registrar-asistencia.component.html",
  styleUrls: ["./registrar-asistencia.component.css"],
})
export class RegistrarAsistenciaComponent implements OnInit, OnDestroy {
  cursos: any[];
  cursoNotSelected: boolean;
  diaActual: string;
  estudiantesXDivision: any[] = [];
  displayedColumns: string[] = ["apellido", "nombre", "accion"];
  fechaActual: Date;
  asistenciaNueva: string = "true";
  agent: any;
  fueraPeriodoCicloLectivo = false;
  isLoading = true;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private servicioEstudiante: EstudiantesService,
    private servicioAsistencia: AsistenciaService,
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
          duration: 8000,
        }
      );
    }

    if (
      this.fechaActualEnCicloLectivo() ||
      this.autenticacionService.getRol() == "Admin"
    ) {
      this.servicioEstudiante
        .obtenerCursos()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          this.cursos = response.cursos;
          this.cursos.sort((a, b) =>
            a.curso.charAt(0) > b.curso.charAt(0)
              ? 1
              : b.curso.charAt(0) > a.curso.charAt(0)
              ? -1
              : 0
          );
          this.isLoading = false;
        });
    } else {
      this.fueraPeriodoCicloLectivo = true;
    }
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

  //Busca los estudiantes segun el curso que se selecciono en pantalla. Los orden alfabeticamente
  onCursoSeleccionado(curso) {
    this.cursoNotSelected = false;
    this.servicioAsistencia
      .cargarAsistencia(curso.value)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (respuesta) => {
          this.asistenciaNueva = respuesta.asistenciaNueva;
          this.estudiantesXDivision = respuesta.estudiantes.sort((a, b) =>
            a.apellido > b.apellido ? 1 : b.apellido > a.apellido ? -1 : 0
          );
        },
        (error) => {
          console.error(
            "Ocurrió un error al querer obtener el estado de la asistencia para cada alumno. El error es: " +
              error
          );
        }
      );
  }

  //Cambia el atributo presente del estudiante cuando se cambia de valor el toggle
  onCambioPresentismo(row) {
    const indexEstudiante = this.estudiantesXDivision.findIndex(
      (objConIDEstudiante) => objConIDEstudiante._id == row._id
    );
    this.estudiantesXDivision[indexEstudiante].presente = !this
      .estudiantesXDivision[indexEstudiante].presente;
  }

  //Envia al servicioEstudiante el vector con los datos de los estudiantes y el presentismo
  onGuardar() {
    this.servicioAsistencia
      .registrarAsistencia(this.estudiantesXDivision, this.asistenciaNueva)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (response) => {
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
        },
        (error) => {
          console.error(
            "Ocurrió un error al querer publicar el estado de la asistencia para un curso. El error es: " +
              error
          );
        }
      );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onCancelar() {
    this.popup.open(AsistenciaPopupComponent, {
      width: "250px",
    });
  }
}

@Component({
  selector: "app-asistencia-popup",
  templateUrl: "./asistencia-popup.component.html",
  styleUrls: ["./registrar-asistencia.component.css"],
})
export class AsistenciaPopupComponent {

  constructor(
    public dialogRef: MatDialogRef<AsistenciaPopupComponent>,
    public router: Router
  ) {
  }

  onYesClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
