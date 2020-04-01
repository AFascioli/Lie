import { AutenticacionService } from "./../../login/autenticacionService.service";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { MatDialog } from "@angular/material";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-justificacion-inasistencia",
  templateUrl: "./justificacion-inasistencia.component.html",
  styleUrls: ["./justificacion-inasistencia.component.css"]
})
export class JustificacionInasistenciaComponent implements OnInit, OnDestroy {
  fechaActual = new Date();
  fechaUnica = new Date();
  fechaInicio = new Date();
  fechaFin = new Date();
  esMultiple: boolean = false;
  ultimasInasistencias = [];
  inasistenciasAJustificar = [];
  fueraDeCursado = false;
<<<<<<< HEAD
  isLoading: boolean = true;
=======
  private unsubscribe: Subject<void> = new Subject();
>>>>>>> actualizareventos

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
        .pipe(takeUntil(this.unsubscribe))
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
      .pipe(takeUntil(this.unsubscribe))
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

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
