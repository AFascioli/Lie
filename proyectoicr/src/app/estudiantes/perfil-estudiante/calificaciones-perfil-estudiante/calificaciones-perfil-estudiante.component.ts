import { Estudiante } from "src/app/estudiantes/estudiante.model";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-calificaciones-perfil-estudiante",
  templateUrl: "./calificaciones-perfil-estudiante.component.html",
  styleUrls: ["./calificaciones-perfil-estudiante.component.css"]
})
export class CalificacionesPerfilEstudianteComponent implements OnInit {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  calificacionesXMateria: any[];
  trimestre: string;
  displayedColumns: string[] = [
    "materia",
    "calif1",
    "calif2",
    "calif3",
    "calif4",
    "calif5",
    "calif6",
    "prom"
  ];
  constructor(public servicio: EstudiantesService, public router: Router) {}

  ngOnInit() {
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this.obtenerTrimestrePorDefecto();
    this.servicio
      .obtenerCalificacionesXMateriaXEstudiante(this.trimestre)
      .subscribe(res => {
        this.calificacionesXMateria = res.vectorCalXMat;
      });
  }

  onChangeTrimestre() {
    this.servicio
      .obtenerCalificacionesXMateriaXEstudiante(this.trimestre)
      .subscribe(res => {
        this.calificacionesXMateria = res.vectorCalXMat;
      });
  }

  obtenerTrimestrePorDefecto() {
    var today = new Date();
    var t1 = new Date(2019, 4, 31);
    var t2 = new Date(2019, 8, 15);

    if (today < t1) this.trimestre = "1";
    else if (today > t2) this.trimestre = "3";
    else this.trimestre = "2";
  }

  //Dado el indice de la tabla que representa una materia, retorna cuantas
  //notas tienen valor distinto a cero
  contadorNotasValidas(index):number{
    var cont =0;
    this.calificacionesXMateria[index].calificaciones.forEach
    (nota => {
      if (nota !=0 && nota != null)
      cont++;
     });
     return cont;
    }


}
