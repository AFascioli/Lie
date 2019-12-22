import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-llegada-tarde",
  templateUrl: "./llegada-tarde.component.html",
  styleUrls: ["./llegada-tarde.component.css"]
})
export class LlegadaTardeComponent implements OnInit {
  fechaActual: Date;
  apellidoEstudiante: string;
  nombreEstudiante: string;
  antes8am = false;
  despues8am = false;
  fueraPeriodoCicloLectivo = false;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAsistencia: AsistenciaService,
    public snackBar: MatSnackBar,
    public autenticacionService: AutenticacionService
  ) {}

  ngOnInit() {
    this.fechaActual = new Date();
    this.fechaActualFinDeSemana();
    if (
      this.fechaActualEnCicloLectivo ||
      this.autenticacionService.getRol() == "Admin"
    ) {
      if (this.fechaActual.getHours() < 8) {
        this.antes8am = true;
      } else {
        this.despues8am = true;
      }
      this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
      this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
    } else {
      this.fueraPeriodoCicloLectivo = true;
    }
  }

  fechaActualFinDeSemana() {
    if (
      this.fechaActual.toString().substring(0, 3) == "Sat" ||
      this.fechaActual.toString().substring(0, 3) == "Sun"
    ) {
      this.snackBar.open(
        "Considere que está queriendo registrar una llegada tarde en un fin de semana",
        "",
        {
          panelClass: ["snack-bar-aviso"],
          duration: 8000
        }
      );
    }
  }

  fechaActualEnCicloLectivo() {
    let fechaInicioPrimerTrimestre = new Date(
      this.autenticacionService.getFechasCicloLectivo().fechaInicioPrimerTrimestre
    );
    let fechaFinTercerTrimestre = new Date(
      this.autenticacionService.getFechasCicloLectivo().fechaFinTercerTrimestre
    );

    return (
      this.fechaActual.getTime() > fechaInicioPrimerTrimestre.getTime() &&
      this.fechaActual.getTime() < fechaFinTercerTrimestre.getTime()
    );
  }

  radioButtonChange() {
    this.antes8am = !this.antes8am;
    this.despues8am = !this.despues8am;
  }

  onGuardar() {
    this.servicioAsistencia
      .registrarLlegadaTarde(this.antes8am)
      .subscribe(result => {
        if (result.exito) {
          this.snackBar.open(result.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500
          });
        } else {
          this.snackBar.open(result.message, "", {
            panelClass: ["snack-bar-fracaso"],
            duration: 4500
          });
        }
      });
  }
}
