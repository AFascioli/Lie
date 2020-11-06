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
  estudiantesXCuotas = [];
  cursoSelected = false;
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
        this.estudiantesXCuotas = response.estudiantesXCuotas;
        this.cursoSelected = true;
      });
  }

  getMes(nroMes) {
    switch (nroMes) {
      case 3:
        return "Marzo";
      case 4:
        return "Abril";
      case 5:
        return "Mayo";
      case 6:
        return "Junio";
      case 7:
        return "Julio";
      case 8:
        return "Agosto";
      case 9:
        return "Septiembre";
      case 10:
        return "Octubre";
      case 11:
        return "Noviembre";
      case 12:
        return "Diciembre";
    }
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
