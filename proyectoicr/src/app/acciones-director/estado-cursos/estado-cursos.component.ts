import { Component, OnInit, ViewChild } from "@angular/core";
import { MatAccordion } from "@angular/material/expansion";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs/internal/Subject";

@Component({
  selector: "app-estado-cursos",
  templateUrl: "./estado-cursos.component.html",
  styleUrls: ["./estado-cursos.component.css"],
})
export class EstadoCursosComponent implements OnInit {
  @ViewChild(MatAccordion, { static: true }) accordion: MatAccordion;

  materiasXCurso: any[] = [];
  displayedColumns: string[] = ["materia", "estado"];
  cursos: any[] = [];
  fechaActual;
  isLoading = true;
  private unsubscribe: Subject<void> = new Subject();

  constructor(private servicioEstudiante: EstudiantesService) {}

  ngOnInit(): void {
    this.fechaActual = new Date();
    this.obtenerCursos();
  }

  async obtenerCursos() {
    this.servicioEstudiante
      .obtenerCursos(this.fechaActual.getFullYear())
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
    setTimeout(() => {
      this.obtenerMaterias();
    }, 500);
  }
  obtenerMaterias() {
    for (let i = 0; i < this.cursos.length; i++) {
      this.servicioEstudiante
        .obtenerMateriasDeCurso(this.cursos[i].id)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.materiasXCurso[i] = respuesta.materias;
          this.materiasXCurso[i].sort((a, b) =>
            a.nombre > b.nombre ? 1 : b.nombre > a.nombre ? -1 : 0
          );
        });
      if (i == this.cursos.length - 1) {
        this.isLoading = false;
      }
    }
  }
}
