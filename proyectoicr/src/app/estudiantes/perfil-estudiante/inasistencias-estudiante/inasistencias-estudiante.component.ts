import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from '../../estudiante.service';

@Component({
  selector: 'app-inasistencias-estudiante',
  templateUrl: './inasistencias-estudiante.component.html',
  styleUrls: ['./inasistencias-estudiante.component.css']
})
export class InasistenciasEstudianteComponent implements OnInit {
  displayedColumns: string[] = ["tipo", "cantidad",];
  contadorInasistenciaJustificada: number;
  contadorInasistenciaInjustificada: number;
  pieChartLabels: string [];
  pieChartData:any[];
  pieChartType:string;

  constructor(public servicio: EstudiantesService) { }

  ngOnInit() {
    this.servicio.obtenerInasistenciasDeEstudiante().subscribe( response => {
      console.log(response);
      this.contadorInasistenciaInjustificada = response.contadorInasistenciasInjustificada;
     this.contadorInasistenciaJustificada= response.contadorInasistenciasJustificada;
    this.pieChartLabels = ['Inasistencias injustificadas', 'Inasistencias justificadas'];
      this.pieChartData = [this.contadorInasistenciaInjustificada, this.contadorInasistenciaJustificada];
      this.pieChartType = 'pie';
    });
    }
}
