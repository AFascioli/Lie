import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Component, OnInit } from "@angular/core";
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
  MatSnackBar
} from "@angular/material";
import { Router } from "@angular/router";
import { NgForm } from "@angular/forms";

@Component({
  selector: "app-calificaciones-estudiantes",
  templateUrl: "./calificaciones-estudiantes.component.html",
  styleUrls: ["./calificaciones-estudiantes.component.css"]
})
export class CalificacionesEstudiantesComponent implements OnInit {
  cursos: any[];
  materias: any[];
  estudiantes: any[];
  displayedColumns: string[] = ["apellido", "nombre", "cal1", "cal2", "cal3","cal4", "cal5", "cal6"];

  constructor(
    public servicio: EstudiantesService,
    public popup: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
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
  }

  onCursoSeleccionado(curso) {
    this.servicio.obtenerMateriasXCurso(curso.value).subscribe(respuesta => {
      this.materias = respuesta.materias;
    });
  }

  onMateriaSeleccionada(form: NgForm) {
    this.servicio
      .obtenerEstudiantesXCursoXMateria(
        form.value.curso,
        form.value.materia,
        form.value.trimestre
      )
      .subscribe(respuesta => {
        this.estudiantes = [...respuesta.estudiantes];
        console.log(this.estudiantes);
      });
  }

  onGuardar(form: NgForm) {
    if (form.invalid) {
      this.snackBar.open("Faltan campos por seleccionar", "", {
        duration: 4500
      });
    } else {
      console.log(this.estudiantes);
      this.servicio
        .registrarCalificaciones(this.estudiantes, form.value.materia, form.value.trimestre )
        .subscribe(respuesta => {
          if (respuesta.exito) {
            this.snackBar.open(respuesta.message, "", {
              duration: 4500
            });
          }
        });
    }
  }

  onCancelar() {
    this.popup.open(CalificacionesEstudiantePopupComponent);
  }
}

@Component({
  selector: "app-calificaciones-estudiantes",
  templateUrl: "./calificaciones-estudiantes-popup.component.html",
  styleUrls: ["./calificaciones-estudiantes.component.css"]
})
export class CalificacionesEstudiantePopupComponent {
  constructor(
    public dialogRef: MatDialogRef<CalificacionesEstudiantePopupComponent>,
    public router: Router
  ) {}

  onYesCancelarClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  onNoCancelarClick(): void {
    this.dialogRef.close();
  }
}
