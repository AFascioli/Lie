import { AutenticacionService } from "./../../login/autenticacionService.service";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { MatDialog } from "@angular/material";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { CicloLectivoService } from "src/app/cicloLectivo.service";

@Component({
  selector: "app-justificacion-inasistencia",
  templateUrl: "./justificacion-inasistencia.component.html",
  styleUrls: ["./justificacion-inasistencia.component.css"],
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
  isLoading: boolean = true;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private servicioAsistencia: AsistenciaService,
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
    public autenticacionService: AutenticacionService,
    public servicioCicloLectivo: CicloLectivoService
  ) {}

  async ngOnInit() {
    if (
      (await this.fechaActualEnPeriodoCursado()) ||
      this.autenticacionService.getRol() == "Admin"
    ) {
      this.servicioAsistencia
        .obtenerUltimasInasistencias()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          this.ultimasInasistencias = response.inasistencias;
          this.isLoading = false;
        });
    } else {
      this.fueraDeCursado = true;
      this.isLoading = false;
    }
  }

  //Se fija si el usuario hizo cambios en la interfaz
  huboCambios() {
    for (const inasistencia of this.ultimasInasistencias) {
      if (inasistencia.justificado) return true;
    }
    return false;
  }

  justificarInasistencia() {
    if (this.huboCambios()) {
      this.servicioAsistencia
        .justificarInasistencia(this.ultimasInasistencias)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          let tipoSnackBar = "snack-bar-fracaso";
          if (response.exito) {
            tipoSnackBar = "snack-bar-exito";
          }
          this.snackBar.open(response.message, "", {
            panelClass: [tipoSnackBar],
            duration: 4500,
          });
          this.ngOnInit();
        });
    } else {
      this.snackBar.open(
        "No se seleccionó ninguna inasistencia para justificar",
        "",
        {
          panelClass: ["snack-bar-fracaso"],
          duration: 4500,
        }
      );
    }
  }

  async fechaActualEnPeriodoCursado() {
    return new Promise((resolve, reject) => {
      this.servicioCicloLectivo.validarEnCursado().subscribe((result) => {
        resolve(result.permiso);
      });
    });
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
