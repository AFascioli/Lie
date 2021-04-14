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
import { ThrowStmt } from "@angular/compiler";

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
  estadoCiclo: string;
  capacidadCurso: number = 0;
  isLoading = true;
  hayCambios = false;
  selectAll = false;

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
    this.hayCambios = false;
    this.loading = true;
    this.seSeleccionoCurso = false;
    this.estudiantes = [];
    if (yearSelected.value == "actual") {
      this.yearSelected = this.aniosCiclos[0];
      this.nextYearSelect = false;
    } else {
      this.yearSelected = this.aniosCiclos[1];
      this.nextYearSelect = true;
      this.snackBar.open(
        "Atención, está por reservar cupos para el año próximo",
        "",
        {
          panelClass: ["snack-bar-aviso"],
          duration: 5000,
        }
      );
    }
    this.obtenerCursosEstudiantes();
    this.capacidadCurso = 0;
  }

  obtenerCursosEstudiantes() {
    this.servicioInscripcion
      .obtenerCursos(this.yearSelected)
      .subscribe((response) => {
        this.loading = false;
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
        this.isLoading = false;
        this.cicloHabilitado =
          response.estadoCiclo == "Creado" ||
          response.estadoCiclo == "En primer trimestre" ||
          response.estadoCiclo == "En segundo trimestre" ||
          response.estadoCiclo == "En tercer trimestre";

        this.estadoCiclo == response.estadoCiclo;
      });
  }

  onCursoSeleccionado(cursoSeleccionado) {
    this.selectAll=false;
    this.hayCambios = false;
    this.loading = true;
    this.cursoSeleccionado = cursoSeleccionado.value;
    this.obtenerCapacidadCurso();
    if (this.yearSelected == this.aniosCiclos[0]) {
      if (this.estadoCiclo == "En tercer trimestre") {
        this.servicioCicloLectivo
          .puedoInscribirTercer(this.cursoSeleccionado)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            if (response.exito) {
              this.obtenerEstudiantesAñoActual();
            } else {
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
      } else {
        this.obtenerEstudiantesAñoActual();
      }
    } else {
      this.obtenerEstudiantesProximoAño();
    }
  }

  obtenerCapacidadCurso() {
    this.servicioInscripcion
      .obtenerCapacidadCurso(this.cursoSeleccionado)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.capacidadCurso = response.capacidad;
      });
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
    this.hayCambios = false;
    if (this.yearSelected == this.aniosCiclos[0]) {
      this.inscribirEstudiantesAñoActual();
    } else {
      this.inscribirEstudiantesProximoAño();
    }
  }

  inscribirEstudiantesAñoActual() {
    this.isLoading = true;
    this.servicioInscripcion
      .inscribirEstudiantesCurso(this.estudiantes, this.cursoSeleccionado)
      .subscribe((response) => {
        if (response.exito) {
          this.isLoading = false;
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
          this.dataSource = new MatTableDataSource(
            this.estudiantes.filter((estudiante) => {
              return !estudiante.seleccionado;
            })
          );
          this.obtenerCapacidadCurso();
          setTimeout(() => {
            this.obtenerCapacidadCurso();
          }, 2000);
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
    this.isLoading = true;
    this.servicioInscripcion
      .inscribirEstudiantesCursoProximoAño(
        this.estudiantes,
        this.cursoSeleccionado
      )
      .subscribe((response) => {
        this.isLoading = false;
        if (response.exito) {
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
          this.obtenerCapacidadCurso();
          this.dataSource = new MatTableDataSource(
            this.estudiantes.filter((estudiante) => {
              return !estudiante.seleccionado;
            })
          );
          this.estudiantes = this.estudiantes.filter((estudiante) => {
            return !estudiante.seleccionado;
          });
          this.obtenerCapacidadCurso();
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

  seleccionarTodos() {
    this.hayCambios=true;
    this.selectAll = !this.selectAll;
    for (let index = 0; index < this.estudiantes.length; index++) {
      this.estudiantes[index].seleccionado = this.selectAll;
    }
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
