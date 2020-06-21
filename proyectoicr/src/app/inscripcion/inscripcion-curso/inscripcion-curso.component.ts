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
  estudiantes: any[];
  seSeleccionoCurso = false;
  loading = false;
  columnasTabla: string[] = [
    "apellido",
    "nombre",
    "curso anterior",
    "seleccionar",
  ];
  dataSource: MatTableDataSource<any>;
  matConfig = new MatDialogConfig();
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public servicioInscripcion: InscripcionService,
    public snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.servicioInscripcion.obtenerCursos().subscribe((response) => {
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

  onCursoSeleccionado(cursoSeleccionado) {
    this.loading = true;
    this.servicioInscripcion
      .obtenerEstudiantesInscripcionCurso(cursoSeleccionado.value)
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
    console.log(this.estudiantes);
    //Llamada al servicio
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
