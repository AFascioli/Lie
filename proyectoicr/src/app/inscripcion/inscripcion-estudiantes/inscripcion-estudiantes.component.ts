import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { InscripcionService } from "../inscripcion.service";
import { EstudiantesService } from "../../estudiantes/estudiante.service";
import { OnInit, Component, ChangeDetectorRef, OnDestroy } from "@angular/core";
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
  MatSnackBar,
} from "@angular/material";
import { NgForm } from "@angular/forms";
import { MediaMatcher } from "@angular/cdk/layout";
import { AutenticacionService } from "src/app/login/autenticacionService.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Router } from "@angular/router";

@Component({
  selector: "app-inscripcion-estudiantes",
  templateUrl: "./inscripcion-estudiantes.component.html",
  styleUrls: ["./inscripcion-estudiantes.component.css"],
})
export class InscripcionEstudianteComponent implements OnInit, OnDestroy {
  cursos: any[];
  diaActual: string;
  cursoSeleccionado: string;
  capacidadCurso: number;
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;
  matConfig = new MatDialogConfig();
  fechaActual = new Date();
  estudianteEstaInscripto: boolean;
  documentosEntregados = [
    { nombre: "Fotocopia documento", entregado: false },
    { nombre: "Ficha médica", entregado: false },
    { nombre: "Informe año anterior", entregado: false },
  ];
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  private unsubscribe: Subject<void> = new Subject();
  isLoading: boolean = true;
  cursoActualYSiguiente: any[] = [];
  yearSelected: any;
  nextYearSelect: boolean;
  tieneInscripcionPendiente: boolean = false;
  cicloHabilitado: boolean;
  estadoCicloLectivo: string;
  aniosCiclos: any[] = [];
  inscripto = false;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioInscripcion: InscripcionService,
    public servicioCicloLectivo: CicloLectivoService,
    public autenticacionService: AutenticacionService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public changeDetectorRef: ChangeDetectorRef,
    public authService: AutenticacionService,
    public media: MediaMatcher,
    private router: Router
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit() {
    this.inscripto = false;
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicioEstudiante.estudianteSeleccionado._id;
    this.cicloActualHabilitado();
    this.servicioEstudiante
      .estudianteEstaInscripto(this._idEstudiante)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.estudianteEstaInscripto = response.exito;
        if (response.exito) this.documentosEntregados = response.documentos;
      });
    this.servicioCicloLectivo
      .obtenerActualYSiguiente()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.aniosCiclos = response.añosCiclos;
        this.servicioInscripcion
          .obtenerCursosInscripcionEstudiante(this.aniosCiclos[0])
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            if (response.cursoActual != "") {
              this.cursoActualYSiguiente.unshift(response.cursoActual.nombre);
            }
            this.isLoading = false;
          });
      });

    this.servicioInscripcion
      .validarInscripcionPendiente(this._idEstudiante)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.tieneInscripcionPendiente = response.inscripcionPendiente;
        this.cursoActualYSiguiente.push(response.curso);
      });
  }

  onCursoSeleccionado(curso) {
    this.cursoSeleccionado = curso.value;
    this.obtenerCapacidadCurso();
    if (this.estadoCicloLectivo == "En tercer trimestre") {
      this.servicioCicloLectivo
        .puedoInscribirTercer(this.cursoSeleccionado)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          if (!response.exito) {
            this.inscripto = true;
            this.snackBar.open(
              "No se puede inscribir en este curso, ya que tiene materias cerradas",
              "",
              {
                panelClass: ["snack-bar-fracaso"],
                duration: 4500,
              }
            );
          }
        });
    }
  }

  onYearSelected(yearSelected) {
    this.cursoSeleccionado = "";
    if (yearSelected.value == "actual") {
      this.yearSelected = this.aniosCiclos[0];
      this.nextYearSelect = false;
    } else {
      this.yearSelected = this.aniosCiclos[1];
      this.nextYearSelect = true;
    }
    this.obtenerCursosEstudiante();
  }

  //Cambia el valor de entregado del documento seleccionado por el usuario
  registrarDocumento(indexDoc: number) {
    this.documentosEntregados[indexDoc].entregado = !this.documentosEntregados[
      indexDoc
    ].entregado;
  }

  inscribirEstudiante() {
    if (this.yearSelected == this.aniosCiclos[0]) {
      this.inscribirEstudianteAñoActual();
    } else {
      this.inscribirEstudianteProximoAño();
    }
  }

  inscribirEstudianteAñoActual() {
    this.isLoading = true;
    this.servicioInscripcion
      .inscribirEstudiante(
        this._idEstudiante,
        this.cursoSeleccionado,
        this.documentosEntregados
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.isLoading = false;
        let exito = response.exito;
        if (exito) {
          this.inscripto = true;
          this.capacidadCurso--;
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 3500,
          });
          this.router.navigate(["./buscar/lista"]);
        } else {
          this.snackBar.open(response.message, "", {
            duration: 4500,
            panelClass: ["snack-bar-fracaso"],
          });
        }
      });
  }

  inscribirEstudianteProximoAño() {
    this.isLoading = true;
    this.servicioInscripcion
      .inscribirEstudianteProximoAño(this._idEstudiante, this.cursoSeleccionado)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.isLoading = false;
        let exito = response.exito;
        if (exito) {
          this.inscripto = true;
          this.capacidadCurso--;
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 3500,
          });
          this.router.navigate(["./buscar/lista"]);
        } else {
          this.snackBar.open(response.message, "", {
            duration: 4500,
            panelClass: ["snack-bar-fracaso"],
          });
        }
      });
  }

  obtenerCursosEstudiante() {
    this.isLoading = true;
    this.servicioInscripcion
      .obtenerCursosInscripcionEstudiante(this.yearSelected)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.cursos = response.cursos;
        //Si tiene inscripcion pendiente, sacamos el curso del select
        if (this.cursoActualYSiguiente[1]) {
          this.cursos = this.cursos.filter((curso) => {
            if (curso.nombre != this.cursoActualYSiguiente[1]) return curso;
          });
        }
        
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
  }

  obtenerCapacidadCurso() {
    this.servicioInscripcion
      .obtenerCapacidadCurso(this.cursoSeleccionado)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.capacidadCurso = response.capacidad;
      });
  }

  openDialogo(form: NgForm) {
    if (form.invalid) {
      this.snackBar.open("No se ha seleccionado un curso", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4500,
      });
    } else {
      if (this.capacidadCurso == 0) {
        this.snackBar.open(
          "El curso seleccionado no tiene más cupos disponibles",
          "",
          {
            panelClass: ["snack-bar-fracaso"],
            duration: 4500,
          }
        );
      } else {
        this.matConfig.width = "250px";
        const popup = this.dialog.open(
          InscripcionPopupComponent,
          this.matConfig
        );
        popup
          .afterClosed()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((resultado) => {
            if (resultado) {
              this.inscribirEstudiante();
              this.estudianteEstaInscripto = false;
            }
          });
      }
    }
  }

  cicloActualHabilitado() {
    this.servicioCicloLectivo
      .obtenerEstadoCicloLectivo()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.cicloHabilitado =
          response.estadoCiclo == "Creado" ||
          response.estadoCiclo == "En primer trimestre" ||
          response.estadoCiclo == "En segundo trimestre" ||
          response.estadoCiclo == "En tercer trimestre";

        this.estadoCicloLectivo = response.estadoCiclo;
      });
  }
}

@Component({
  selector: "app-inscripcion-popup",
  templateUrl: "./inscripcion-popup.component.html",
  styleUrls: [
    "./inscripcion-estudiantes.component.css",
    "../../app.component.css",
  ],
})
export class InscripcionPopupComponent implements OnDestroy {
  private unsubscribe: Subject<void> = new Subject();

  constructor(public dialogRef: MatDialogRef<InscripcionPopupComponent>) {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onNoCancelarConfirmarClick(): void {
    this.dialogRef.close(false);
  }

  onYesConfirmarClick(): void {
    this.dialogRef.close(true);
  }
}
