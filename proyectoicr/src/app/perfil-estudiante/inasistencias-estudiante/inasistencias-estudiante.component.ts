import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { EstudiantesService } from "./../../estudiantes/estudiante.service";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import { Label } from "ng2-charts";
import { ChartOptions, ChartType } from "chart.js";
import * as pluginDataLabels from "chartjs-plugin-datalabels";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

@Component({
  selector: "app-inasistencias-estudiante",
  templateUrl: "./inasistencias-estudiante.component.html",
  styleUrls: ["./inasistencias-estudiante.component.css"],
})
export class InasistenciasEstudianteComponent implements OnInit, OnDestroy {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  displayedColumns: string[] = ["tipo", "cantidad"];
  contadorInasistenciaJustificada: number;
  contadorInasistenciaInjustificada: number;
  barChartLabels: Label[] = [];
  cantidadFaltasParaSuspension: number;

  private unsubscribe: Subject<void> = new Subject();
  public barChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      labels: {
        fontSize: 18,
      },
    },
    plugins: {
      datalabels: {
        font: {
          size: 20,
          weight: "bold",
        },
      },
    },
  };
  barDataSet = [];

  public barChartType: ChartType = "pie";
  public barChartPlugins = [pluginDataLabels];
  public barChartLegend;

  constructor(
    public servicioAsistencia: AsistenciaService,
    public servicioEstudiante: EstudiantesService,
    public servicioCicloLectivo: CicloLectivoService
  ) {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit() {
    this.servicioCicloLectivo
      .obtenerFaltasSuspensionCicloLectivo()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.cantidadFaltasParaSuspension = response.faltas;
      });
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
    this.servicioAsistencia
      .obtenerInasistenciasDeEstudiante()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.contadorInasistenciaInjustificada =
          response.contadorInasistenciasInjustificada;
        this.contadorInasistenciaJustificada =
          response.contadorInasistenciasJustificada;
        this.barDataSet = [
          {
            backgroundColor: ["#38AECC", "#E9FE00"],
            data: [
              response.contadorInasistenciasInjustificada,
              response.contadorInasistenciasJustificada,
            ],
          },
        ];

        this.barChartLabels = [
          "Inasistencias injustificadas",
          "Inasistencias justificadas",
        ];
      });
  }
  public descargarPDF() {
    var element = document.getElementById("content");

    html2canvas(element).then((canvas) => {
      console.log(canvas);
      var imgData = canvas.toDataURL("image/png");
      var doc = new jsPDF();
      var imgH = (canvas.height * 208) / canvas.width;
      doc.text("Inasistencias ", 7, 15);
      doc.addImage(imgData, 0, 30, 208, imgH);
      doc.save("test.pdf");
    });
  }
}
