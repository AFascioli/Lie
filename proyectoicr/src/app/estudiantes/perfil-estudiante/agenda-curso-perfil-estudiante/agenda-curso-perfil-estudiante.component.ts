import { Component, OnInit } from '@angular/core';
import { Estudiante } from 'src/app/estudiantes/estudiante.model';
import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agenda-curso-perfil-estudiante',
  templateUrl: './agenda-curso-perfil-estudiante.component.html',
  styleUrls: ['./agenda-curso-perfil-estudiante.component.css']
})
export class AgendaCursoPerfilEstudianteComponent implements OnInit {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;
  constructor(public servicio: EstudiantesService,  public router: Router) { }

  ngOnInit() {
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicio.estudianteSeleccionado._id;
  }

}
