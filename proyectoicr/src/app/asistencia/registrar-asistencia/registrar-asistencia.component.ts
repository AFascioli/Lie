import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';

@Component({
  selector: 'app-registrar-asistencia',
  templateUrl: './registrar-asistencia.component.html',
  styleUrls: ['./registrar-asistencia.component.css']
})
export class RegistrarAsistenciaComponent implements OnInit {

  constructor(private servicio: EstudiantesService) { }

  ngOnInit() {
  }

  buscarEstudiantesPorDivision(curso: string){
    this.servicio.buscarEstudiantesPorDivision(curso);
  }
}
