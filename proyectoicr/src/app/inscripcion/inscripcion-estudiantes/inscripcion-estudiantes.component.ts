import { InscripcionService } from "../inscripcion.service";
import { EstudiantesService } from "../../estudiantes/estudiante.service";
import {
  OnInit,
  Component,
  Inject,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
  MAT_DIALOG_DATA,
  MatSnackBar,
} from "@angular/material";
import { NgForm } from "@angular/forms";
import { MediaMatcher } from "@angular/cdk/layout";
import { AutenticacionService } from "src/app/login/autenticacionService.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

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
  fechaActual: Date;
  estudianteEstaInscripto: boolean;
  documentosEntregados = [
    { nombre: "Fotocopia documento", entregado: false },
    { nombre: "Ficha medica", entregado: false },
    { nombre: "Informe año anterior", entregado: false },
  ];
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  fechaDentroDeRangoInscripcion: boolean = true;
  private unsubscribe: Subject<void> = new Subject();
  isLoading: boolean = true;
  cursoActual: any;
  yearSelected: any;
  nextYearSelect: boolean;
  tieneInscripcionPendiente: boolean = false;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioInscripcion: InscripcionService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public changeDetectorRef: ChangeDetectorRef,
    public authService: AutenticacionService,
    public media: MediaMatcher
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
    this.fechaActual = new Date();
    if (
      this.fechaActualEnRangoFechasInscripcion() ||
      this.authService.getRol() == "Admin"
    ) {
      this.fechaDentroDeRangoInscripcion = true;
    }
    //this.authService.getFechasCicloLectivo();
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicioEstudiante.estudianteSeleccionado._id;
    this.servicioEstudiante
      .estudianteEstaInscripto(this._idEstudiante)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.estudianteEstaInscripto = response.exito;
      });
    this.servicioInscripcion
      .obtenerCursosInscripcionEstudiante(this.fechaActual.getFullYear())
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        if (response.cursoActual != "") {
          this.cursoActual = response.cursoActual.nombre;
        }
      });
    this.servicioInscripcion
      .validarInscripcionPendiente(this._idEstudiante)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.tieneInscripcionPendiente = response.inscripcionPendiente;
      });
    this.isLoading = false;
  }

  fechaActualEnRangoFechasInscripcion() {
    let fechaInicioInscripcion = new Date(
      this.authService.getFechasCicloLectivo().fechaInicioInscripcion
    );
    let fechaFinInscripcion = new Date(
      this.authService.getFechasCicloLectivo().fechaFinInscripcion
    );

    return (
      this.fechaActual.getTime() > fechaInicioInscripcion.getTime() &&
      this.fechaActual.getTime() < fechaFinInscripcion.getTime()
    );
  }

  //Obtiene la capacidad del curso seleccionado
  onCursoSeleccionado(curso) {
    this.cursoSeleccionado = curso.value;
    this.obtenerCapacidadCurso();
  }

  onYearSelected(yearSelected) {
    this.cursoSeleccionado = null;
    if (yearSelected.value == "actual") {
      this.yearSelected = this.fechaActual.getFullYear();
      this.nextYearSelect = false;
    } else {
      this.yearSelected = this.fechaActual.getFullYear() + 1;
      this.nextYearSelect = true;
    }
    this.capacidadCurso = -1;
    this.obtenerCursosEstudiante();
  }

  //Cambia el valor de entregado del documento seleccionado por el usuario
  registrarDocumento(indexDoc: number) {
    this.documentosEntregados[indexDoc].entregado = !this.documentosEntregados[
      indexDoc
    ].entregado;
  }

  inscribirEstudiante() {
    if (this.yearSelected == this.fechaActual.getFullYear()) {
      this.inscribirEstudianteAñoActual();
    } else {
      this.inscribirEstudianteProximoAño();
    }
  }

  inscribirEstudianteAñoActual() {
    this.servicioInscripcion
      .inscribirEstudiante(
        this._idEstudiante,
        this.cursoSeleccionado,
        this.documentosEntregados
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        let exito = response.exito;
        if (exito) {
          this.capacidadCurso--;
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
          this.obtenerCursosEstudiante();
        } else {
          this.snackBar.open(response.message, "", {
            duration: 4500,
            panelClass: ["snack-bar-fracaso"],
          });
        }
      });
  }

  inscribirEstudianteProximoAño() {
    this.servicioInscripcion
      .inscribirEstudianteProximoAño(this._idEstudiante, this.cursoSeleccionado)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        let exito = response.exito;
        if (exito) {
          this.capacidadCurso--;
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
          this.obtenerCursosEstudiante();
        } else {
          this.snackBar.open(response.message, "", {
            duration: 4500,
            panelClass: ["snack-bar-fracaso"],
          });
        }
      });
  }

  obtenerCursosEstudiante() {
    this.servicioInscripcion
      .obtenerCursosInscripcionEstudiante(this.yearSelected)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.cursos = response.cursos;
        this.cursos.sort((a, b) =>
          a.nombre.charAt(0) > b.nombre.charAt(0)
            ? 1
            : b.nombre.charAt(0) > a.nombre.charAt(0)
            ? -1
            : 0
        );
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

  constructor(
    public dialogRef: MatDialogRef<InscripcionPopupComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {}

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
