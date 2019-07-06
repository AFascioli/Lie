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
      estudiantesXDivision.forEach(objConIDEstudiante => {
        objConIDEstudiante.IdEstudiante.presente= false;
      });
      console.dir(estudiantesXDivision);
      this.estudiantesXDivision= estudiantesXDivision;
    });
  }

  //Cambia el atributo presente del estudiante cuando se cambia de valor el toggle
  onCambioPresentismo(row){
    const indexEstudiante=this.estudiantesXDivision.
    findIndex(objConIDEstudiante=>objConIDEstudiante.IdEstudiante._id==row.IdEstudiante._id);
    this.estudiantesXDivision[indexEstudiante].IdEstudiante.presente=!this.estudiantesXDivision[indexEstudiante].IdEstudiante.presente;
    console.dir(this.estudiantesXDivision);
  }
}
