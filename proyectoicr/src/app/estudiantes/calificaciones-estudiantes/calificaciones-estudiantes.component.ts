import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Component, OnInit } from "@angular/core";
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
  MatSnackBar
} from "@angular/material";
import { Router } from "@angular/router";

@Component({
  selector: "app-calificaciones-estudiantes",
  templateUrl: "./calificaciones-estudiantes.component.html",
  styleUrls: ["./calificaciones-estudiantes.component.css"]
})
export class CalificacionesEstudiantesComponent implements OnInit {
  cursos: any[];
  materias: any[];
  estudiantes: any[] = [];
  displayedColumns: string[] = ["apellido", "nombre", "cal1", "cal2", "cal3"];

  constructor(public servicio: EstudiantesService) {}

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

  onMateriaSeleccionada(materia, curso) {
    this.servicio.obtenerEstudiantesXCursoXMateria(curso.value, materia.value).subscribe(respuesta => {
      this.estudiantes = respuesta.estudiantes;
    });
  }
}
