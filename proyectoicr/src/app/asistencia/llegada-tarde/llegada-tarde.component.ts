import { CicloLectivoService } from "./../../cicloLectivo.service";
import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import { MatSnackBar } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
  selector: "app-llegada-tarde",
  templateUrl: "./llegada-tarde.component.html",
  styleUrls: ["./llegada-tarde.component.css"],
})
export class LlegadaTardeComponent implements OnInit, OnDestroy {
  fechaActual: Date = new Date();
  apellidoEstudiante: string;
  nombreEstudiante: string;
  antesHorario = false;
  private unsubscribe: Subject<void> = new Subject();
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  horaLlegadaTarde;
  fueraPeriodoCicloLectivo: Boolean = false;
  isLoading = true;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAsistencia: AsistenciaService,
    public servicioCicloLectivo: CicloLectivoService,
    public snackBar: MatSnackBar,
    public autenticacionService: AutenticacionService,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 800px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.verificarEstadoCiclo();
    this.fechaActualFinDeSemana();
    this.servicioCicloLectivo
      .obtenerHoraLlegadaTarde()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.horaLlegadaTarde = response.hora;
        this.isLoading = false;
      });
    if (this.fechaActual.getHours() < this.horaLlegadaTarde) {
      this.antesHorario = true;
    }
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
  }

  verificarEstadoCiclo() {
    this.servicioCicloLectivo
      .obtenerEstadoCicloLectivo()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.fueraPeriodoCicloLectivo = !(
          response.estadoCiclo == "En primer trimestre" ||
          response.estadoCiclo == "En segundo trimestre" ||
          response.estadoCiclo == "En tercer trimestre"
        );
      });
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
          duration: 8000,
        }
      );
    }
  }

  radioButtonChange() {
    this.antesHorario = !this.antesHorario;
  }

  onGuardar() {
    this.isLoading = true;
    this.servicioAsistencia
      .registrarLlegadaTarde(this.antesHorario)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((result) => {
        if (result.exito) {
          this.snackBar.open(result.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
        } else {
          this.snackBar.open(result.message, "", {
            panelClass: ["snack-bar-fracaso"],
            duration: 4500,
          });
        }
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
