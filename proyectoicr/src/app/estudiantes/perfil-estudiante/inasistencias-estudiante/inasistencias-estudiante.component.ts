import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "../../estudiante.service";
import { Label } from "ng2-charts";
import { ChartDataSets, ChartOptions, ChartType } from "chart.js";
import * as pluginDataLabels from "chartjs-plugin-datalabels";

@Component({
  selector: "app-inasistencias-estudiante",
  templateUrl: "./inasistencias-estudiante.component.html",
  styleUrls: ["./inasistencias-estudiante.component.css"]
})
export class InasistenciasEstudianteComponent implements OnInit {
  displayedColumns: string[] = ["tipo", "cantidad"];
  contadorInasistenciaJustificada: number;
  contadorInasistenciaInjustificada: number;
  barChartData: any[];
barChartLabels: Label[]

  constructor(public servicio: EstudiantesService) {}

  ngOnInit() {
    this.servicio.obtenerInasistenciasDeEstudiante().subscribe(response => {
      this.contadorInasistenciaInjustificada =
        response.contadorInasistenciasInjustificada;
      this.contadorInasistenciaJustificada =
        response.contadorInasistenciasJustificada;

        this.barChartData= [
          this.contadorInasistenciaInjustificada,this.contadorInasistenciaJustificada
        ];
        this.barChartLabels= ['Inasistencias injustificadas', 'Inasistencias justificadas'];
    });
  }

  public barChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      datalabels: {
        font: {
          size: 20,
          weight: "bold"
        }
      }
    }
  };

  public barChartType: ChartType = 'pie';
  public barChartPlugins = [pluginDataLabels];


}