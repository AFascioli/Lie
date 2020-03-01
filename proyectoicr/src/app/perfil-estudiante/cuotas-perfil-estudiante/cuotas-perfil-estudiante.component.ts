import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "../../estudiantes/estudiante.service";
import { Estudiante } from "../../estudiantes/estudiante.model";

@Component({
  selector: "app-datos-estudiante",
  templateUrl: "./cuotas-perfil-estudiante.component.html",
  styleUrls: ["./cuotas-perfil-estudiante.component.css"]
})
export class CuotasPerfilEstudianteComponent implements OnInit {
  estudiante: Estudiante;
  cuotasV: any[] = [];
  datasource: any[] = [];
  displayedColumns: string[] = ["Mes", "Pagado"];

  constructor(public servicio: EstudiantesService) {}

  ngOnInit() {
    this.servicio.getCuotasDeEstudiante().subscribe(respuesta => {
      this.cuotasV = respuesta.cuotas;
    });
  }

  //ver de hacerlo mejor
  getMes(i) {
    switch (i) {
      case 1:
        return "Enero";
      case 2:
        return "Febrero";
      case 3:
        return "Marzo";
      case 4:
        return "Abril";
      case 5:
        return "Mayo";
      case 6:
        return "Junio";
      case 7:
        return "Julio";
      case 8:
        return "Agosto";
      case 9:
        return "Septiembre";
      case 10:
        return "Octubre";
      case 11:
        return "Noviembre";
      case 12:
        return "Diciembre";
    }
  }
}
