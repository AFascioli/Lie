
import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../estudiante.model';

@Component({
  selector: 'app-calificaciones-estudiantes',
  templateUrl: './calificaciones-estudiantes.component.html',
  styleUrls: ['./calificaciones-estudiantes.component.css']
})
export class CalificacionesEstudiantesComponent implements OnInit {
  estudiantes: Estudiante[] = [];
  calificaciones: any[] = [];
  displayedColumns: string[] = ["apellido", "nombre", "calif1", "calif2", "calif3","calif4", "calif5", "promedio" ];

  constructor() { }

  ngOnInit() {


  }

onCancelar() {

  }

}
