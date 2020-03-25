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
  displayedColumns: string[] = [
    "tipoSancion",
    "cantidad",
    "fecha",
  ];

  constructor(
    public servicio: EstudiantesService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.servicio.getSancionesDeEstudiante().subscribe(respuesta => {
      if (respuesta.exito) {
        this.sanciones = respuesta.sanciones;
        console.log(this.sanciones);
        this.snackBar.open(respuesta.message, "", {
          panelClass: ["snack-bar-exito"],
          duration: 3000
        });
      }
    });
  }
}
