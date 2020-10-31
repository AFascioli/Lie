import { CicloLectivoService } from "./../../cicloLectivo.service";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import { UbicacionService } from "src/app/ubicacion/ubicacion.service";
import { CalificacionesService } from "../../calificaciones/calificaciones.service";
import { InscripcionService } from "../../inscripcion/inscripcion.service";
import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { EstudiantesService } from "../estudiante.service";
import { Estudiante } from "../estudiante.model";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { MediaMatcher } from "@angular/cdk/layout";
import { MatDialogRef, MatDialog, MatSnackBar } from "@angular/material";

@Component({
  selector: "app-lista-estudiantes",
  templateUrl: "./lista-estudiantes.component.html",
  styleUrls: ["./lista-estudiantes.component.css"],
})
export class ListaEstudiantesComponent implements OnInit, OnDestroy {
  estudiantes: Estudiante[] = [];
  inscripto: any[] = [];
  cursos: any[] = [];
  cursosDeDocente: any[] = [];
  suspendido: any[] = [];
  private unsubscribe: Subject<void> = new Subject();
  permisos = {
    notas: 0,
    asistencia: 0,
    eventos: 0,
    sanciones: 0,
    agendaCursos: 0,
    inscribirEstudiante: 0,
    registrarEmpleado: 0,
    cuotas: 0,
  };
  isLoading: boolean = true;
  rol: string;
  materiasPendientes: boolean[] = [];
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  estadoCiclo: string;

  constructor(
    public servicio: EstudiantesService,
    public servicioCalificaciones: CalificacionesService,
    public servicioAsistencia: AsistenciaService,
    public servicioInscripcion: InscripcionService,
    public CicloLectivoService: CicloLectivoService,
    public servicioUbicacion: UbicacionService,
    public router: Router,
    public authService: AutenticacionService,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 700px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit() {
    this.obtenerEstadoCicloLectivo();
    this.servicio
      .getEstudiantesListener()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((estudiantesBuscados) => {
        this.estudiantes = estudiantesBuscados;
        this.isLoading = false;
        for (let i = 0; i < estudiantesBuscados.length; i++) {
          this.servicio
            .obtenerCursoDeEstudianteById(this.estudiantes[i]._id)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((response) => {
              this.inscripto[i] = response.exito;
              this.cursos[i] = response.curso;
              if (this.inscripto[i]) {
                this.servicioCalificaciones
                  .obtenerMateriasDesaprobadasEstudiante(
                    this.estudiantes[i]._id
                  )
                  .subscribe((response) => {
                    this.materiasPendientes.push(
                      response.materiasDesaprobadas.length > 0
                    );
                  });

                // Validación por suspendido
                this.servicio
                  .esEstudianteSuspendido(this.estudiantes[i]._id)
                  .pipe(takeUntil(this.unsubscribe))
                  .subscribe((response) => {
                    this.suspendido[i] = response.exito;
                  });
              }
            });
        }
      });

    if (!this.servicio.retornoDesdeAcciones) {
      this.servicio.retornoDesdeAcciones = false;
    }

    this.authService
      .obtenerPermisosDeRol()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.permisos = response.permisos;
      });
    this.rol = this.authService.getRol();
    if (this.rol == "Docente") {
      this.authService
        .obtenerIdEmpleado(this.authService.getId())
        .subscribe((response) => {
          this.servicio
            .obtenerCursosDeDocente(response.id)
            .subscribe((response2) => {
              response2.cursos.forEach((objetoCurso) => {
                this.cursosDeDocente.push(objetoCurso.curso);
              });
            });
        });
    }
    this.isLoading = false;
  }

  //Retorna un booleano segun si se deberia mostrar la opcion Registrar examen
  //(si rol es docente, el estudiante debe estar en el curso del docente)
  correspondeRegistrarExamen(indexEstudiante: number) {
    if (this.rol == "Docente") {
      return this.cursosDeDocente.includes(this.cursos[indexEstudiante]);
    } else {
      if (this.rol == "Admin") return true;
      else return false;
    }
  }

  asignarEstudianteSeleccionado(indice) {
    this.servicio.estudianteSeleccionado = this.estudiantes.find(
      (estudiante) =>
        estudiante.numeroDocumento === this.estudiantes[indice].numeroDocumento
    );
    this.servicioCalificaciones.estudianteSeleccionado = this.servicio.estudianteSeleccionado;
    this.servicioAsistencia.estudianteSeleccionado = this.servicio.estudianteSeleccionado;
    this.servicioInscripcion.estudianteSeleccionado = this.servicio.estudianteSeleccionado;
    this.servicioUbicacion.estudianteSeleccionado = this.servicio.estudianteSeleccionado;
    this.servicio.retornoDesdeAcciones = true;
  }

  onInscribir(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./inscribirEstudiante"]);
  }

  onMostrar(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./mostrar"]);
  }

  onRetiro(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./retiroAnticipado"]);
  }

  onLlegadaTarde(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./llegadaTarde"]);
  }

  onVisualizarPerfil(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./perfilEstudiante"]);
  }

  onSancion(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./registrarSancion"]);
  }

  onJustificar(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./justificarInasistencia"]);
  }

  onAsociarAR(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.dialog
      .open(AsociarAdultoResponsablePopupComponent, {
        width: "250px",
      })
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((result) => {
        if (result) {
          this.router.navigate(["./altaAdultoResponsable"]);
        } else {
          this.router.navigate(["./asociarAdultoResponsable"]);
        }
      });
  }

  onRegistrarExamenes(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./calificacionesExamenes"]);
  }

  onNotificarReunion(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./solicitudReunion"]);
  }

  obtenerEstadoCicloLectivo() {
    this.CicloLectivoService.obtenerEstadoCicloLectivo()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.estadoCiclo = response.estadoCiclo;
      });
  }

  onReincorporar(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.dialog
      .open(ReincorporarPopupComponent, {
        width: "250px",
      })
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((result) => {
        if (result) {
          this.servicio
            .reincorporarEstudianteSeleccionado()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((response) => {
              if (response.exito) {
                this.suspendido[indice] = false;
                this.snackBar.open(response.message, "", {
                  panelClass: ["snack-bar-exito"],
                  duration: 4000,
                });
              } else {
                this.snackBar.open(response.message, "", {
                  panelClass: ["snack-bar-fracaso"],
                  duration: 4000,
                });
              }
            });
        }
      });
  }
}

@Component({
  selector: "app-reincorporar-popup",
  templateUrl: "./reincorporar-popup.component.html",
  styleUrls: ["../alta-estudiantes/alta-estudiantes.component.css"],
})
export class ReincorporarPopupComponent {
  constructor(public dialogRef: MatDialogRef<ReincorporarPopupComponent>) {}

  onYesClick(): void {
    this.dialogRef.close(true);
  }
  onNoClick(): void {
    this.dialogRef.close(false);
  }
}

@Component({
  selector: "app-asociar-adulto-responsable-popup",
  templateUrl: "./asociar-adulto-responsable-popup.component.html",
  styleUrls: ["../buscar-estudiantes/buscar-estudiantes.component.css"],
})
export class AsociarAdultoResponsablePopupComponent {
  constructor(
    public dialogRef: MatDialogRef<ReincorporarPopupComponent>,
    public router: Router,
    public servicio: EstudiantesService
  ) {}

  addNewOne(): void {
    this.dialogRef.close(true);
  }
  addOldOne(): void {
    this.dialogRef.close(false);
  }
}
