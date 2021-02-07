import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { Component, OnInit } from "@angular/core";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs/internal/Subject";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-parametrizar-reglas-negocio",
  templateUrl: "./parametrizar-reglas-negocio.component.html",
  styleUrls: ["./parametrizar-reglas-negocio.component.css"],
})
export class ParametrizarReglasNegocioComponent implements OnInit {
  horaLlegadaTarde: string;
  horaRetiroAnticipado: string;
  cantidadFaltasSuspension: number;
  cantidadMateriasInscripcionLibre: number;
  estadoCiclo: string;
  aniosCiclos;

  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private servicioCicloLectivo: CicloLectivoService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.servicioCicloLectivo
      .obtenerActualYSiguiente()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.aniosCiclos = response.añosCiclos;
      });
    this.servicioCicloLectivo
      .obtenerParametrosProxCicloLectivo()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.horaLlegadaTarde = response.cicloLectivo.horarioLLegadaTarde;
        this.horaRetiroAnticipado =
          response.cicloLectivo.horarioRetiroAnticipado;
        this.cantidadFaltasSuspension =
          response.cicloLectivo.cantidadFaltasSuspension;
        this.cantidadMateriasInscripcionLibre =
          response.cicloLectivo.cantidadMateriasInscripcionLibre;
      });
  }

  onGuardar() {
    if (
      this.cantidadFaltasSuspension &&
      this.cantidadMateriasInscripcionLibre &&
      this.horaLlegadaTarde &&
      this.horaRetiroAnticipado
    ) {
      this.servicioCicloLectivo
        .guardarParametros(
          this.cantidadFaltasSuspension,
          this.cantidadMateriasInscripcionLibre,
          this.horaLlegadaTarde,
          this.horaRetiroAnticipado
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(
          (response) => {
            this.snackBar.open(response.message, "", {
              panelClass: ["snack-bar-exito"],
              duration: 4500,
            });
          },
          (error) => {
            console.error(
              "Ocurrió un error al querer guardar los parámetros. El error es: " +
                error
            );
          }
        );
    } else {
      this.snackBar.open("Faltan campos por completar", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4500,
      });
    }
  }
}
