import { ReportesService } from "./../reportes.service";
import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

@Component({
  selector: "app-doc-adeudados",
  templateUrl: "./reporte-doc-adeudados.component.html",
  styleUrls: ["./doc-adeudados.component.css"],
})
export class DocAdeudadosComponent implements OnInit {
  cursos;
  fechaActual: Date;
  valueCursoSelected;
  estudiantesXDocs = [];
  cursoSelected = false;
  private unsubscribe: Subject<void> = new Subject();
  displayedColumns: string[] = ["estudiante", "documentos"];

  constructor(
    public servicioEstudiante: EstudiantesService,
    public reportService: ReportesService
  ) {}

  ngOnInit(): void {
    this.fechaActual = new Date();
    this.obtenerCursos();
  }

  obtenerDocsAdeudados(curso) {
    this.valueCursoSelected = this.obtenerNombreCurso(curso.value);
    this.reportService
      .obtenerDocsAdeudados(curso.value)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.estudiantesXDocs = response.estudiantesXDocs;
        this.estudiantesXDocs.sort((a, b) =>
        a.nombres.toLowerCase().charAt(0) > b.nombres.toLowerCase().charAt(0)
        ? 1
        : b.nombres.toLowerCase().charAt(0) > a.nombres.toLowerCase().charAt(0)
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

  getDocumentos(i) {
    let estudiante = this.estudiantesXDocs[i];
    let docs = " ";
    estudiante.documentos.forEach((doc) => {
      docs += doc + ", ";
    });
    return docs.substring(0, docs.length - 2);
  }

  public descargarPDF() {
    var element = document.getElementById("content");

    html2canvas(element).then((canvas) => {
      var imgData = canvas.toDataURL("image/png");
      var doc = new jsPDF();
      var imgH = (canvas.height * 145) / canvas.width;
      var imgICR = new Image();
      imgICR.src = 'assets/reports/logoICR.png'
      var imgLIE = new Image();
      imgLIE.src = 'assets/reports/logoLIE.png'
      doc.addImage(imgICR,10,2,15,15);
      doc.addImage(imgLIE,190,4,10,10);
      doc.setTextColor(156,156,156);
      doc.setFontSize(10);
      doc.setFont("Segoe UI");
      doc.text("Instituto Cristo Rey", 94, 7);
      doc.text("Ciclo lectivo " + this.fechaActual.getFullYear(), 95, 12);
      doc.setDrawColor(184, 184, 184);
      doc.line(10, 17, 200, 17);
      doc.addImage(imgData, 30, 30, 145, imgH);
      // doc.addImage(imgData, 30, 10, 145, imgH);
      doc.save("DocumentosAdeudados-" + this.valueCursoSelected + ".pdf");
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
