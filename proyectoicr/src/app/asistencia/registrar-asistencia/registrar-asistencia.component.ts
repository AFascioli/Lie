import { CicloLectivoService } from "./../../cicloLectivo.service";
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
  cursoNotSelected: boolean = true;
  diaActual: string;
  estudiantesXDivision: any[] = [];
  displayedColumns: string[] = ["apellido", "nombre", "accion"];
  fechaActual: Date = new Date();
  asistenciaNueva: string = "true";
  agent: any;
  fueraPeriodoCicloLectivo = false;
  isLoading = true;
  private unsubscribe: Subject<void> = new Subject();
  isLoadingStudents: boolean = true;
  idSuspendido: string;
  aniosCiclos;

  constructor(
    private servicioEstudiante: EstudiantesService,
    private servicioCicloLectivo: CicloLectivoService,
    private servicioAsistencia: AsistenciaService,
    public popup: MatDialog,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.servicioCicloLectivo
      .obtenerActualYSiguiente()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.aniosCiclos = response.añosCiclos;
        this.servicioEstudiante
          .obtenerCursos(this.aniosCiclos[0])
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            this.cursos = response.cursos;
            this.cursos.sort((a, b) =>
            a.nombre.charAt(0) > b.nombre.charAt(0)
              ? 1
              : b.nombre.charAt(0) > a.nombre.charAt(0)
              ? -1
              : a.nombre.charAt(1) > b.nombre.charAt(1)
              ? 1
              : b.nombre.charAt(1) > a.nombre.charAt(1)
              ? -1
              : 0
          );
            this.isLoading = false;
          });
      });

    this.obtenerIdInscripcionSuspendida();

    if (
      this.fechaActual.toString().substring(0, 3) == "Sat" ||
      this.fechaActual.toString().substring(0, 3) == "Sun"
    ) {
      this.snackBar.open(
        "Considere que está queriendo registrar una asistencia en un fin de semana",
        "",
        {
          panelClass: ["snack-bar-aviso"],
          duration: 4000,
        }
      );
    }
  }

  //Busca los estudiantes segun el curso que se selecciono en pantalla. Los orden alfabeticamente
  onCursoSeleccionado(curso) {
    this.cursoNotSelected = false;
    this.servicioAsistencia
      .cargarAsistencia(curso.value)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((respuesta) => {
        this.asistenciaNueva = respuesta.asistenciaNueva;
        if (respuesta.estudiantes.length != 0) {
          this.estudiantesXDivision = respuesta.estudiantes.sort((a, b) =>
            a.apellido.toLowerCase() > b.apellido.toLowerCase()
              ? 1
              : b.apellido.toLowerCase() > a.apellido.toLowerCase()
              ? -1
              : 0
          );
        } else {
          this.estudiantesXDivision = [];
        }
        this.isLoadingStudents = false;
      });
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
      .subscribe((response) => {
        this.snackBar.open(response.message, "", {
          panelClass: ["snack-bar-exito"],
          duration: 4500,
        });
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  esSuspendido(estudiantesXDivision) {
    if (estudiantesXDivision.estado == this.idSuspendido) {
      estudiantesXDivision.presente = false;
      return true;
    }
    return false;
  }

  obtenerIdInscripcionSuspendida() {
    this.servicioEstudiante
      .obtenerIdSuspendido()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.idSuspendido = response.respuesta;
      });
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
  ) {}

  onYesClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
