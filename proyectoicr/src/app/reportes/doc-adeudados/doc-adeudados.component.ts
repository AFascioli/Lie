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
      doc.addImage(imgData, 30, 10, 145, imgH);
      doc.save("DocumentosAdeudados-" + this.valueCursoSelected + ".pdf");
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
