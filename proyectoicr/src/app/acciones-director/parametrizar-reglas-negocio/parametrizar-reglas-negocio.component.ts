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
  horaLlegadaTardeAntes: string;
  horaLlegadaTardeDespues: string;
  horaRetiroAnticipadoAntes: string;
  horaRetiroAnticipadoDespues: string;
  cantidadFaltasSuspension: number;
  cantidadMateriasInscripcionLibre: number;

  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private servicioCicloLectivo: CicloLectivoService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.servicioCicloLectivo
      .obtenerParametrosCicloLectivo()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.horaLlegadaTardeAntes =
          response.cicloLectivo.horarioLLegadaTardeAntes;
        this.horaLlegadaTardeDespues =
          response.cicloLectivo.horarioLLegadaTardeDespues;
        this.horaRetiroAnticipadoAntes =
          response.cicloLectivo.horarioRetiroAnticipadoAntes;
        this.horaRetiroAnticipadoDespues =
          response.cicloLectivo.horarioRetiroAnticipadoDespues;
        this.cantidadFaltasSuspension =
          response.cicloLectivo.cantidadFaltasSuspension;
        this.cantidadMateriasInscripcionLibre =
          response.cicloLectivo.cantidadMateriasInscripcionLibre;
      });
  }

  onGuardar() {
    // console.log(this.horaLlegadaTardeAntes);
    // console.log(this.horaRetiroAnticipadoDespues);
    this.servicioCicloLectivo
      .guardarParametros(
        this.cantidadFaltasSuspension,
        this.cantidadMateriasInscripcionLibre,
        this.horaLlegadaTardeAntes,
        this.horaLlegadaTardeDespues,
        this.horaRetiroAnticipadoAntes,
        this.horaRetiroAnticipadoDespues
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
  }
}
