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
  contadorInasistencia: number;
  pieChartLabels: string [];
  pieChartData:any[];
  pieChartType:string;

  constructor(public servicio: EstudiantesService) { }

  ngOnInit() {
    this.servicio.obtenerInasistenciasDeEstudiante().subscribe( response => {
      this.contadorInasistencia = response.contadorInasistencias;
     this.contadorInasistenciaJustificada= response.contadorInasistenciasJustificada;
    this.pieChartLabels = ['Inasistencias', 'Inasistencias Justificadas'];
      this.pieChartData = [this.contadorInasistencia, this.contadorInasistenciaJustificada];
      this.pieChartType = 'pie';
    });
    }
}
