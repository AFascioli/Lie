import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';

@Component({
  selector: 'app-registrar-asistencia',
  templateUrl: './registrar-asistencia.component.html',
  styleUrls: ['./registrar-asistencia.component.css']
})
export class RegistrarAsistenciaComponent implements OnInit {
  estudiantesXDivision: any[];
  displayedColumns: string[] = ["apellido", "nombre", "accion"];

  constructor(private servicio: EstudiantesService) { }

  ngOnInit() {
  }

  buscarEstudiantesPorDivision(curso: string){
    this.servicio.buscarEstudiantesPorDivision(curso);
    this.servicio.getEstudiantesXDivisionListener().subscribe(estudiantesXDivision =>{
      this.estudiantesXDivision= estudiantesXDivision.sort( (a,b) => (a.apellido > b.apellido) ? 1 : ((b.apellido > a.apellido) ? -1 : 0) );
    });
  }

  //Cambia el atributo presente del estudiante cuando se cambia de valor el toggle
  onCambioPresentismo(row){
    const indexEstudiante=this.estudiantesXDivision.
    findIndex(objConIDEstudiante=>objConIDEstudiante._id==row._id);
    this.estudiantesXDivision[indexEstudiante].presente=!this.estudiantesXDivision[indexEstudiante].presente;
  }
}
