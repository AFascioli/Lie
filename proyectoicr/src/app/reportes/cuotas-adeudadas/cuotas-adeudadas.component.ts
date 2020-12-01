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
        this.estudiantesXCuotas.sort((a, b) =>
          a.nombres.toLowerCase().charAt(0) > b.nombres.toLowerCase().charAt(0)
            ? 1
            : b.nombres.toLowerCase().charAt(0) >
              a.nombres.toLowerCase().charAt(0)
            ? -1
            : 0
        );
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

    //formato fecha
    const o_date = new Intl.DateTimeFormat();
    const f_date = (m_ca, m_it) => Object({ ...m_ca, [m_it.type]: m_it.value });
    const m_date = o_date.formatToParts().reduce(f_date, {});

    let pag=1;

    html2canvas(element).then((canvas) => {
      var imgData = canvas.toDataURL("image/png");
      var imgWidth = 175;
      var pageHeight = 295;
      var imgHeight = (canvas.height * imgWidth) / canvas.width;
      var heightLeft = imgHeight;
      var doc = new jsPDF("p", "mm");
      var position = 30;

      var imgICR = new Image();
      imgICR.src = "assets/reports/logoICR.png";
      var imgLIE = new Image();
      imgLIE.src = "assets/reports/logoLIE.png";
      doc.addImage(imgICR, 10, 2, 15, 15);
      doc.addImage(imgLIE, 190, 4, 10, 10);
      doc.setTextColor(156, 156, 156);
      doc.setFontSize(10);
      doc.setFont("Segoe UI");
      doc.text("Instituto Cristo Rey", 94, 7);
      doc.text("Ciclo lectivo " + this.fechaActual.getFullYear(), 95, 12);
      doc.setDrawColor(184, 184, 184);
      doc.line(10, 17, 200, 17);
      doc.addImage(imgData, "PNG", 16, position, imgWidth, imgHeight);

      heightLeft -= pageHeight - 18;
      doc.setFillColor(255, 255, 255);
      doc.rect(0, pageHeight - 10, 200, 12, "F");
      doc.text("Fecha: " + m_date.day + '/' + m_date.month + '/' + m_date.year, 10, pageHeight - 5);
      doc.text("Página: 1", 180, pageHeight - 5);

      while (heightLeft >= 0) {
        position += heightLeft - imgHeight + 10;
        doc.addPage();
        pag++;
        doc.addImage(imgData, "PNG", 16, position, imgWidth, imgHeight);

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 200, 17, "F");

        doc.addImage(imgICR, 10, 2, 15, 15);
        doc.addImage(imgLIE, 190, 4, 10, 10);
        doc.setTextColor(156, 156, 156);
        doc.setFontSize(10);
        doc.setFont("Segoe UI");
        doc.text("Instituto Cristo Rey", 94, 7);
        doc.text("Ciclo lectivo " + this.fechaActual.getFullYear(), 95, 12);
        doc.setDrawColor(184, 184, 184);
        doc.line(10, 17, 200, 17);
        doc.text("Fecha: " + m_date.day + '/' + m_date.month + '/' + m_date.year, 10, pageHeight - 5);
        doc.text("Página: " + pag, 180, pageHeight - 5);
        heightLeft -= pageHeight;

      }
      doc.save("CuotasAdeudadas-" + this.valueCursoSelected + ".pdf");
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
