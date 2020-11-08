import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { ReportesService } from "../reportes.service";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

@Component({
  selector: "app-cuotas-adeudadas",
  templateUrl: "./reporte-cuotas-adeudadas.component.html",
  styleUrls: ["./cuotas-adeudadas.component.css"],
})
export class CuotasAdeudadasComponent implements OnInit {
  cursos;
  valueCursoSelected;
  fechaActual: Date;
  estudiantesXCuotas = [];
  cursoSelected = false;
  private unsubscribe: Subject<void> = new Subject();
  displayedColumns: string[] = ["estudiante", "cuotas"];

  constructor(
    public servicioEstudiante: EstudiantesService,
    public reportService: ReportesService
  ) {}

  ngOnInit(): void {
    this.fechaActual = new Date();
    this.obtenerCursos();
  }

  obtenerCuotasAdeudadas(curso) {
    this.valueCursoSelected = this.obtenerNombreCurso(curso.value);
    this.reportService
      .obtenerCuotasAdeudadas(curso.value)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.estudiantesXCuotas = response.estudiantesXCuotas;
        this.cursoSelected = true;
      });
  }

  obtenerNombreCurso(idCurso) {
    for (let index = 0; index < this.cursos.length; index++) {
      if (this.cursos[index].id == idCurso) {
        return this.cursos[index].nombre;
      }
    }
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

  getCuotas(i) {
    let estudiante = this.estudiantesXCuotas[i];
    let cuotas = " ";
    estudiante.mesCuotas.forEach((cuota) => {
      cuotas += this.getMes(cuota) + ", ";
    });
    return cuotas.substring(0, cuotas.length - 2);
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

  public descargarPDF() {
    var element = document.getElementById("content");

    html2canvas(element).then((canvas) => {
      var imgData = canvas.toDataURL("image/png");
      var doc = new jsPDF();
      var imgH = (canvas.height * 145) / canvas.width;
      doc.addImage(imgData, 30, 10, 145, imgH);
      doc.save("CuotasAdeudadas-" + this.valueCursoSelected + ".pdf");
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
