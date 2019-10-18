import { EstudiantesService } from "./../../estudiantes/estudiante.service";
import { Component, OnInit } from "@angular/core";
import {  MatSnackBar } from "@angular/material";
import {
  MatDialog
} from "@angular/material";

@Component({
  selector: "app-justificacion-inasistencia",
  templateUrl: "./justificacion-inasistencia.component.html",
  styleUrls: ["./justificacion-inasistencia.component.css"]
})
export class JustificacionInasistenciaComponent implements OnInit {
  fechaActual = new Date();
  fechaUnica = new Date();
  fechaInicio = new Date();
  fechaFin = new Date();
  esMultiple: boolean = false;
  ultimasInasistencias = [];
  inasistenciasAJustificar = [];

  constructor(
    private servicio: EstudiantesService,
    public snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.servicio.obtenerUltimasInasistencias().subscribe(response => {
      this.ultimasInasistencias = response.inasistencias;
    });
  }

  justificarInasistencia() {
    this.servicio
      .justificarInasistencia(this.ultimasInasistencias)
      .subscribe(response => {
        let tipoSnackBar = "snack-bar-fracaso";
        if (response.exito) {
          tipoSnackBar = "snack-bar-exito";
        }
        this.snackBar.open(response.message, "", {
          panelClass: [tipoSnackBar],
          duration: 4500
        });
        this.ngOnInit();
      });
  }

  //Con el indice, cambia el valor del campo justificado de la inasistencia
  onChecked(index: number) {
    this.ultimasInasistencias[index].justificado = !this.ultimasInasistencias[
      index
    ].justificado;
  }
}

