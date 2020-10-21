import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { ReportesService } from "../reportes.service";

@Component({
  selector: "app-cuotas-adeudadas",
  templateUrl: "./cuotas-adeudadas.component.html",
  styleUrls: ["./cuotas-adeudadas.component.css"],
})
export class CuotasAdeudadasComponent implements OnInit {
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

  obtenerCuotasAdeudadas(curso) {
    this.reportService
      .obtenerCuotasAdeudadas(curso.value)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        console.log(response);
        //mes cuotas: mes que adeuda, si dice 4 significa que debe abril y así..
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
