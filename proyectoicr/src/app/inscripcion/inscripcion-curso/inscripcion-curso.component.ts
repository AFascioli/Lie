import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { MatSnackBar, MatDialog, MatDialogConfig } from "@angular/material";
import { InscripcionService } from "./../inscripcion.service";
import { Component, OnInit, OnDestroy, Inject } from "@angular/core";
import {
  MatTableDataSource,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-inscripcion-curso",
  templateUrl: "./inscripcion-curso.component.html",
  styleUrls: ["./inscripcion-curso.component.css"],
})
export class InscripcionCursoComponent implements OnInit {
  cursos: any[];
  estudiantes = [];
  seSeleccionoCurso = false;
  cursoSeleccionado: string;
  loading = false;
  columnasTabla: string[] = [
    "apellido",
    "nombre",
    "curso anterior",
    "seleccionar",
  ];
  dataSource: MatTableDataSource<any>;
  matConfig = new MatDialogConfig();
  yearSelected: any;
  nextYearSelect: boolean;
  private unsubscribe: Subject<void> = new Subject();
  cicloHabilitado: boolean;
  aniosCiclos: any[];

  constructor(
    public servicioInscripcion: InscripcionService,
    public snackBar: MatSnackBar,
    public servicioCicloLectivo: CicloLectivoService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.servicioCicloLectivo
      .obtenerActualYSiguiente()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.aniosCiclos = response.añosCiclos;
      });
    this.cicloActualHabilitado();
  }

  onYearSelected(yearSelected) {
    if (yearSelected.value == "actual") {
      this.yearSelected = this.aniosCiclos[0];
      this.nextYearSelect = false;
    } else {
      this.yearSelected = this.aniosCiclos[1];
      this.nextYearSelect = true;
    }
    this.obtenerCursosEstudiantes();
  }

  obtenerCursosEstudiantes() {
    this.servicioInscripcion
      .obtenerCursos(this.yearSelected)
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
      });
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
      });
  }

  onCursoSeleccionado(cursoSeleccionado) {
    this.loading = true;
    this.cursoSeleccionado = cursoSeleccionado.value;
    if (this.yearSelected == this.aniosCiclos[0]) {
      this.obtenerEstudiantesAñoActual();
    } else {
      this.obtenerEstudiantesProximoAño();
    }
  }

  obtenerEstudiantesAñoActual() {
    this.servicioInscripcion
      .obtenerEstudiantesInscripcionCurso(this.cursoSeleccionado)
      .subscribe((response) => {
        this.estudiantes = [...response.estudiantes];
        this.estudiantes = this.estudiantes.sort((a, b) =>
          a.apellido > b.apellido ? 1 : b.apellido > a.apellido ? -1 : 0
        );
        this.dataSource = new MatTableDataSource(this.estudiantes);
        this.loading = false;
        this.seSeleccionoCurso = true;
      });
  }

  obtenerEstudiantesProximoAño() {
    this.servicioInscripcion
      .obtenerEstudiantesInscripcionCursoProximoAnio(this.cursoSeleccionado)
      .subscribe((response) => {
        this.estudiantes = [...response.estudiantes];
        this.estudiantes = this.estudiantes.sort((a, b) =>
          a.apellido > b.apellido ? 1 : b.apellido > a.apellido ? -1 : 0
        );
        this.dataSource = new MatTableDataSource(this.estudiantes);
        this.loading = false;
        this.seSeleccionoCurso = true;
      });
  }

  inscribirEstudiantes() {
    if (this.yearSelected == this.aniosCiclos[0]) {
      this.inscribirEstudiantesAñoActual();
    } else {
      this.inscribirEstudiantesProximoAño();
    }
  }

  inscribirEstudiantesAñoActual() {
    this.servicioInscripcion
      .inscribirEstudiantesCurso(this.estudiantes, this.cursoSeleccionado)
      .subscribe((response) => {
        if (response.exito) {
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
          this.dataSource = new MatTableDataSource(
            this.estudiantes.filter((estudiante) => {
              return !estudiante.seleccionado;
            })
          );
          this.estudiantes = this.estudiantes.filter((estudiante) => {
            return !estudiante.seleccionado;
          });
        } else {
          this.snackBar.open(
            "Ocurrió un error al inscribir los estudiantes seleccionados",
            "",
            {
              panelClass: ["snack-bar-fracaso"],
              duration: 4500,
            }
          );
        }
      });
  }

  inscribirEstudiantesProximoAño() {
    this.servicioInscripcion
      .inscribirEstudiantesCursoProximoAño(
        this.estudiantes,
        this.cursoSeleccionado
      )
      .subscribe((response) => {
        if (response.exito) {
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
          this.dataSource = new MatTableDataSource(
            this.estudiantes.filter((estudiante) => {
              return !estudiante.seleccionado;
            })
          );
          this.estudiantes = this.estudiantes.filter((estudiante) => {
            return !estudiante.seleccionado;
          });
        } else {
          this.snackBar.open(
            "Ocurrió un error al inscribir los estudiantes seleccionados",
            "",
            {
              panelClass: ["snack-bar-fracaso"],
              duration: 4500,
            }
          );
        }
      });
  }

  openDialogo() {
    if (!this.seSeleccionoCurso) {
      this.snackBar.open("No se ha seleccionado un curso", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4500,
      });
    } else {
      if (this.estudiantes.some((estudiante) => estudiante.seleccionado)) {
        //Checkea si se selecciono al menos un estudiante
        this.matConfig.width = "250px";
        const popup = this.dialog.open(
          InscripcionCursoPopupComponent,
          this.matConfig
        );
        popup
          .afterClosed()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((resultado) => {
            if (resultado) {
              this.inscribirEstudiantes();
            }
          });
      } else {
        this.snackBar.open("No se ha seleccionado ningún estudiante", "", {
          panelClass: ["snack-bar-fracaso"],
          duration: 4500,
        });
      }
    }
  }
}

@Component({
  selector: "app-inscripcion-curso-popup",
  templateUrl: "./inscripcion-curso-popup.component.html",
  styleUrls: ["./inscripcion-curso.component.css", "../../app.component.css"],
})
export class InscripcionCursoPopupComponent implements OnDestroy {
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public dialogRef: MatDialogRef<InscripcionCursoPopupComponent>,
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
