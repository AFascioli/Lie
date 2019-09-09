import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from "../estudiante.service";

@Component({
  selector: 'app-perfil-estudiante',
  templateUrl: './perfil-estudiante.component.html',
  styleUrls: ['./perfil-estudiante.component.css']
})
export class PerfilEstudianteComponent implements OnInit {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;
  constructor(public servicio: EstudiantesService) { }

  ngOnInit() {
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicio.estudianteSeleccionado._id;
  }

}
