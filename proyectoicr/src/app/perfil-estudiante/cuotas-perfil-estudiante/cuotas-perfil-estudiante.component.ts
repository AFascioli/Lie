import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { EstudiantesService } from "../../estudiantes/estudiante.service";
import { Estudiante } from "../../estudiantes/estudiante.model";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { MediaMatcher } from "@angular/cdk/layout";
import { CicloLectivoService } from "src/app/cicloLectivo.service";

@Component({
  selector: "app-datos-estudiante",
  templateUrl: "./cuotas-perfil-estudiante.component.html",
  styleUrls: ["./cuotas-perfil-estudiante.component.css"],
})
export class CuotasPerfilEstudianteComponent implements OnInit, OnDestroy {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  estudiante: Estudiante;
  estadoCuotasXMes: any[] = [];
  datasource: any[] = [];
  displayedColumns: string[] = ["Mes", "Pagado"];
  private unsubscribe: Subject<void> = new Subject();
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  isLoading=false;
  esAnioActual= false;

  constructor(
    public servicio: EstudiantesService,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher,
    public servicioCicloLectivo: CicloLectivoService
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 880px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.isLoading=true;
    this.servicio
      .getCuotasDeEstudiante()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((respuesta) => {
        this.estadoCuotasXMes = respuesta.cuotas;
        this.servicioCicloLectivo
        .obtenerActualYSiguiente()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          this.esAnioActual = response.añosCiclos[0] == (new Date()).getFullYear()
          this.isLoading=false;
        });
      });
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  validarMesAnterior(mesCuota){
    if (this.esAnioActual) {
      let numeroMesActual = (new Date()).getMonth() + 1
      return mesCuota < numeroMesActual
    } else {
      return false
    }

  }

  getMes(i) {
    switch (i) {
      case 3:
        return "Marzo";
      case 4:
        return "Abril";
      case 5:
        return "Mayo";
      case 6:
        return "Junio";
      case 7:
        return "Julio";
      case 8:
        return "Agosto";
      case 9:
        return "Septiembre";
      case 10:
        return "Octubre";
      case 11:
        return "Noviembre";
      case 12:
        return "Diciembre";
    }
  }
}
