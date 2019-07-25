import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-documentos-inscripcion',
  templateUrl: './documentos-inscripcion.component.html',
  styleUrls: ['./documentos-inscripcion.component.css']
})
export class DocumentosInscripcionComponent implements OnInit {
  anios: number[]= [];
  divisionesXAno: any[];
  divisionesFiltradas: any[];
  seleccionDeAnio: boolean = false;
  anoSeleccionado: string;
  estudiantesConDocumentos: any[]=[];
  displayedColumns: string[] = ["apellido", "nombre", "fotocopiaDoc", "fichaMed", "informeAnt"];

  constructor(public servicio: EstudiantesService) { }

  ngOnInit() {
    this.servicio.obtenerDivisionesXAño();
    this.servicio.getDivisionXAñoListener().subscribe(divisionesXAño => {
      this.divisionesXAno = divisionesXAño;
      this.divisionesXAno.forEach(element => {
        this.anios.push(element.ano);
      });
      this.anios.sort((a, b) =>
      a > b ? 1 : b > a ? -1 : 0);
    });
  }

  //Filtra las divisiones segun el año seleccionado y las ordena alfanumericamente
  FiltrarDivisiones() {
    this.seleccionDeAnio= true;
    this.divisionesFiltradas = this.divisionesXAno.find(
      divisionXAño => divisionXAño.ano === this.anoSeleccionado
    ).divisiones;
    this.divisionesFiltradas.sort((a, b) =>
    a > b ? 1 : b > a ? -1 : 0);
  }

  //Cuando el usuario selecciona una division, se obtienen los datos del estudiantes necesarios
  onCursoSeleccionado(curso){
    this.servicio.obtenerEstudiantesXCurso(curso.value).subscribe(estudiantes =>{
      this.estudiantesConDocumentos= estudiantes;
      console.log(this.estudiantesConDocumentos);
    });
  }
}
