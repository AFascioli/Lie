import { EstudiantesService } from "./../../estudiantes/estudiante.service";
import { Component, OnInit } from "@angular/core";
import { DateAdapter, MatSnackBar } from "@angular/material";
import { NgForm } from "@angular/forms";

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

  constructor(
    private servicio: EstudiantesService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit() {}

  //Envia al servicio un fecha inicio y una fecha fin (esta de esta manera por la consulta del backend)
  justificarInasistencia() {
    var fechaInicio;
    var fechaFin;
    if (this.esMultiple) {
      fechaInicio = new Date(this.fechaInicio.setHours(0, 0, 0));
      fechaFin = new Date(this.fechaFin.setHours(23, 59, 59));
    } else {
      fechaInicio = new Date(this.fechaUnica.setHours(0, 0, 0));
      fechaFin = new Date(this.fechaUnica.setHours(23, 59, 59));
    }
    this.servicio
      .justificarInasistencia(fechaInicio.toString(), fechaFin.toString(),this.esMultiple)
      .subscribe(respuesta => {
        this.snackBar.open(respuesta.message, "", {
          duration: 4500
        });
      });
  }

  //Deshabilita los inputs y los pickers
  deshabilitarPickers(form: NgForm) {
    this.esMultiple = !this.esMultiple;
  }
}
