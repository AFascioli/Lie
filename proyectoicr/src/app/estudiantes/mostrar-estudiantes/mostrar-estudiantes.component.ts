import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from '../estudiante.service';

@Component({
  selector: 'app-mostrar-estudiantes',
  templateUrl: './mostrar-estudiantes.component.html',
  styleUrls: ['./mostrar-estudiantes.component.css']
})
export class MostrarEstudiantesComponent implements OnInit {

  constructor(public servicio: EstudiantesService) { }

  ngOnInit() {
  }

}
