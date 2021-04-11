import { Component, OnInit, ViewChild } from "@angular/core";
import { MatAccordion } from "@angular/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { ReportesService } from "../reportes.service";

@Component({
  selector: "app-promedio-cursos",
  templateUrl: "./promedio-cursos.component.html",
  styleUrls: ["./promedio-cursos.component.css"],
})
export class PromedioCursosComponent implements OnInit {
  @ViewChild(MatAccordion, { static: true }) accordion: MatAccordion;
  private unsubscribe: Subject<void> = new Subject();
  isLoading = false;
  promediosAnios = [];
  anios = [];
  displayedColumns: string[] = ["materia", "promedio"];
  anioReporte;

  constructor(
    private serviceReporte: ReportesService,
    private serviceCicloLectivo: CicloLectivoService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.serviceCicloLectivo
      .obtenerActualYAnteriores()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.anios = response.añosCiclos;
        this.isLoading = false;
      });
  }

  onCicloSeleccionado(cicloLectivoSeleccionado) {
    this.isLoading = true;
    this.anioReporte = cicloLectivoSeleccionado;
    this.serviceReporte
      .obtenerPromedioCursos(cicloLectivoSeleccionado)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.sacarPromedioAnio(response.arrayCursos);
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  public descargarPDF() {
    
    var element = document.getElementById("content");

    //formato fecha
    const o_date = new Intl.DateTimeFormat();
    const f_date = (m_ca, m_it) => Object({ ...m_ca, [m_it.type]: m_it.value });
    const m_date = o_date.formatToParts().reduce(f_date, {});

    let pag = 1;

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
      doc.text("Ciclo lectivo " + this.anioReporte, 95, 12);
      doc.setDrawColor(184, 184, 184);
      doc.line(10, 17, 200, 17);
      doc.addImage(imgData, "PNG", 16, position, imgWidth, imgHeight);

      heightLeft -= pageHeight - 18;
      doc.setFillColor(255, 255, 255);
      doc.rect(0, pageHeight - 10, 200, 12, "F");
      doc.text(
        "Fecha: " + m_date.day + "/" + m_date.month + "/" + m_date.year,
        10,
        pageHeight - 5
      );
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
        doc.text("Ciclo lectivo " + this.anioReporte, 95, 12);
        doc.setDrawColor(184, 184, 184);
        doc.line(10, 17, 200, 17);
        doc.text(
          "Fecha: " + m_date.day + "/" + m_date.month + "/" + m_date.year,
          10,
          pageHeight - 5
        );
        doc.text("Página: " + pag, 180, pageHeight - 5);
        heightLeft -= pageHeight;
      }
      doc.save("Promedio-cursos.pdf");
    });
  }

  //Crea un array que tiene
  //  {anio: 1, promedioAnio: 6,4,
  //   divisiones: [ {nombreCurso: "name",
  //                 promedioGral: 9,
  //                 materias:[{
  //                  nombreMateria: "Name",
  //                  promedioMateria:9}]
  //                } ]}
  //
  sacarPromedioAnio(cursosYPromedios) {
    this.promediosAnios = [
      {
        anio: 1,
        divisiones: [],
        promedioAnio: 0,
      },
      {
        anio: 2,
        divisiones: [],
        promedioAnio: 0,
      },
      {
        anio: 3,
        divisiones: [],
        promedioAnio: 0,
      },
      {
        anio: 4,
        divisiones: [],
        promedioAnio: 0,
      },
      {
        anio: 5,
        divisiones: [],
        promedioAnio: 0,
      },
      {
        anio: 6,
        divisiones: [],
        promedioAnio: 0,
      },
    ];
    for (const curso of cursosYPromedios) {
      for (const cursoFrontend of this.promediosAnios) {
        //Si el curso es del mismo año
        if (parseInt(curso.nombreCurso[0]) == cursoFrontend.anio) {
          //Si es de la division A va primero en el array
          if (curso.nombreCurso[1] == "A") {
            cursoFrontend.divisiones.unshift(curso);
          } else {
            cursoFrontend.divisiones.push(curso);
          }
          //Si ya estan las dos divisiones, se calcula el promedio del año
          if (cursoFrontend.divisiones.length == 2) {
            cursoFrontend.promedioAnio = parseFloat(
              (
                (cursoFrontend.divisiones[0].promedioGral +
                  curso.promedioGral) /
                2
              ).toFixed(2)
            );
            for (const division of cursoFrontend.divisiones) {
              division.materias.sort((a, b) =>
                a.nombreMateria.charAt(0) > b.nombreMateria.charAt(0)
                  ? 1
                  : b.nombreMateria.charAt(0) > a.nombreMateria.charAt(0)
                  ? -1
                  : a.nombreMateria.charAt(1) > b.nombreMateria.charAt(1)
                  ? 1
                  : b.nombreMateria.charAt(1) > a.nombreMateria.charAt(1)
                  ? -1
                  : 0
              );
            }
          }
        }
      }
    }
  }
}
