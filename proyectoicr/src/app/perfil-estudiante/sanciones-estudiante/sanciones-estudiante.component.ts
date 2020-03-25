import { Component, OnInit } from "@angular/core";
import { Estudiante } from "src/app/estudiantes/estudiante.model";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-sanciones-estudiante",
  templateUrl: "./sanciones-estudiante.component.html",
  styleUrls: ["./sanciones-estudiante.component.css"]
})
export class SancionesEstudianteComponent implements OnInit {
  sanciones: any[] = [];
  displayedColumns: string[] = ["fecha", "tipoSancion", "cantidad"];

  sumatoriaSanciones = [0,0,0,0];

  constructor(
    public servicio: EstudiantesService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.servicio.getSancionesDeEstudiante().subscribe(respuesta => {
      if (respuesta.exito) {
        this.sanciones = respuesta.sanciones;
        if(this.sanciones.length!=0){
          this.calcularSumatoriaSanciones();
        }
      }
    });
  }

  calcularSumatoriaSanciones() {
    this.sanciones.forEach(sancion => {
      switch (sancion.tipo) {
        case "Llamado de atencion":
          this.sumatoriaSanciones[0]+=sancion.cantidad;
          break;
        case "Apercibimiento":
          this.sumatoriaSanciones[1]+=sancion.cantidad;
          break;
        case "Amonestacion":
          this.sumatoriaSanciones[2]+=sancion.cantidad;
          break;
        case "Suspencion":
          this.sumatoriaSanciones[3]+=sancion.cantidad;
          break;
      }
    });
  }
}
