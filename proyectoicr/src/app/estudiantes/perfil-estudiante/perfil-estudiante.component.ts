import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from "../estudiante.service";
import { Estudiante } from '../estudiante.model';
import { Router } from '@angular/router';


@Component({
  selector: 'app-perfil-estudiante',
  templateUrl: './perfil-estudiante.component.html',
  styleUrls: ['./perfil-estudiante.component.css']
})
export class PerfilEstudianteComponent implements OnInit {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  estudiantes: Estudiante[] = [];
  _idEstudiante: string;
  displayedColumns: string[] = ["tipo", "cantidad",];




  constructor(public servicio: EstudiantesService,  public router: Router) { }



  ngOnInit() {
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicio.estudianteSeleccionado._id;
  }

  onVisualizarCalificacionesEstudiante(indice){
    this.router.navigate(["./calificacionesEstudiante"]);
  }

  onVisualizarAgendaCursoEstudiante(indice){
    this.router.navigate(["./calificacionesEstudiante"]);
  }

}

