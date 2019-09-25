import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from "../estudiante.service";
import { Estudiante } from '../estudiante.model';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialog } from '@angular/material';
import { AdultoResponsableService } from 'src/app/adulto-responsable/adultoResponsable.service';
import { AdultoResponsable } from 'src/app/adulto-responsable/adultoResponsable.model';


@Component({
  selector: 'app-perfil-estudiante',
  templateUrl: './perfil-estudiante.component.html',
  styleUrls: ['./perfil-estudiante.component.css']
})
export class PerfilEstudianteComponent implements OnInit {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  apellidoAR: string;
  nombreAR: string;
  estudiantes: Estudiante[] = [];
  adulto: AdultoResponsable[] = [];
  _idEstudiante: string;
  idUsuario: string;
  displayedColumns: string[] = ["tipo", "cantidad",];
  contadorInasistenciaJustificada: number;
  contadorInasistencia: number;
  pieChartLabels: string [];
  pieChartData:number[];
  pieChartType:string;

  constructor(
    public servicio: EstudiantesService,
    public servicioAR: AdultoResponsableService,
    public router: Router,
    public popup: MatDialog) { }

  ngOnInit() {
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicio.estudianteSeleccionado._id;
    this.apellidoAR= this.servicioAR.adultoResponsableEstudiante.apellido;
    this.nombreAR = this.servicioAR.adultoResponsableEstudiante.nombre;
    this.idUsuario = this.servicioAR.adultoResponsableEstudiante.idUsuario;
    this.servicio.obtenerInasistenciasDeEstudiante().subscribe( response => {
      this.contadorInasistencia = response.contadorInasistencias;
      this.contadorInasistenciaJustificada= response.contadorInasistenciasJustificada;
      this.pieChartLabels = ['Inasistencias', 'Inasistencias Justificadas'];
      this.pieChartData = [this.contadorInasistencia, this.contadorInasistenciaJustificada];
      this.pieChartType = 'pie';
      });
    this.servicio.getTutoresDeEstudiante();
  }



  onVisualizarCalificacionesEstudiante(){
    this.router.navigate(["./calificacionesEstudiante"]);
  }

  onVisualizarAgendaCursoEstudiante(){
    this.router.navigate(["./calificacionesEstudiante"]);
  }

  onCancelar(){
    this.popup.open(PerfilEstudiantePopupComponent);
  }

}
  @Component({
    selector: "app-perfil-estudiante-popup",
    templateUrl: "./perfil-estudiante-popup.component.html",
    styleUrls: ["./perfil-estudiante.component.css"]
  })
  export class PerfilEstudiantePopupComponent {
    constructor(
      public dialogRef: MatDialogRef<PerfilEstudiantePopupComponent>,
      public router: Router,
      public servicio: EstudiantesService
    ) {}

    onYesCancelarClick(): void {
      this.router.navigate(["./home"]);
      this.dialogRef.close();
    }

    onNoCancelarClick(): void {
      this.dialogRef.close();
    }
  }


