import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from '../../estudiante.service';
import { Estudiante } from '../../estudiante.model';

@Component({
  selector: 'app-datos-estudiante',
  templateUrl: './datos-estudiante.component.html',
  styleUrls: ['./datos-estudiante.component.css']
})
export class DatosEstudianteComponent implements OnInit {
  estudiante: Estudiante;

  constructor(public servicio: EstudiantesService) {
    this.estudiante = this.servicio.estudianteSeleccionado;
   }

  ngOnInit() {
  }

}
