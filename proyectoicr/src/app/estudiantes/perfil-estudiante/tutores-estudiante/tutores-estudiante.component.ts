import { EstudiantesService } from './../../estudiante.service';
import { Component, OnInit } from '@angular/core';
import { AdultoResponsable } from 'src/app/adulto-responsable/adultoResponsable.model';

@Component({
  selector: 'app-tutores-estudiante',
  templateUrl: './tutores-estudiante.component.html',
  styleUrls: ['./tutores-estudiante.component.css']
})
export class TutoresEstudianteComponent implements OnInit {
  tutores: any[];
  displayedColumns: string[] = [
    "apellido",
    "nombre",
    "telefono"
  ];

  constructor(public servicio: EstudiantesService) { }

  ngOnInit()
  {
    this.servicio.getTutoresDeEstudiante().subscribe(respuesta =>
      {
        this.tutores= respuesta.tutores;
      });
  }

}
