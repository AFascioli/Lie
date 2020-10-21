import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { ReportesService } from "../reportes.service";

@Component({
  selector: "app-resumen-academico",
  templateUrl: "./resumen-academico.component.html",
  styleUrls: ["./resumen-academico.component.css"],
})
export class ResumenAcademicoComponent implements OnInit {
  cursos;
  fechaActual: Date;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public servicioEstudiante: EstudiantesService,
    public reportService: ReportesService
  ) {}

  ngOnInit(): void {
    this.fechaActual = new Date();
    this.obtenerCursos();
  }

  obtenerEstudiantesDelCurso(curso) {
    this.reportService
      .obtenerEstudiantesDelCurso(curso.value)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        console.log(response);
      });
  }

  obtenerCursos() {
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
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
