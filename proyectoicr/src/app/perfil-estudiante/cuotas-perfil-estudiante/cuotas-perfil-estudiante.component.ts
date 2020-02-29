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
      console.log(this.cuotasV);
    });
  }
}
