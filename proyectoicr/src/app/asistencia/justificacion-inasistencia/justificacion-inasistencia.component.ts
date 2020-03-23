import { AutenticacionService } from "./../../login/autenticacionService.service";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import { Component, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { MatDialog } from "@angular/material";

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
  fueraDeCursado = false;
  isLoading: boolean = true;

  constructor(
    private servicioAsistencia: AsistenciaService,
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
    public autenticacionService: AutenticacionService
  ) {}

  ngOnInit() {
    if (
      this.fechaActualEnPeriodoCursado ||
      this.autenticacionService.getRol() == "Admin"
    ) {
      this.servicioAsistencia
        .obtenerUltimasInasistencias()
        .subscribe(response => {
          this.ultimasInasistencias = response.inasistencias;
          this.isLoading = false;
        });
    } else {
      this.fueraDeCursado = true;
    }
  }

  justificarInasistencia() {
    this.servicioAsistencia
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

  fechaActualEnPeriodoCursado() {
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

  //Con el indice, cambia el valor del campo justificado de la inasistencia
  onChecked(index: number) {
    this.ultimasInasistencias[index].justificado = !this.ultimasInasistencias[
      index
    ].justificado;
  }
}
