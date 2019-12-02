import { AutenticacionService } from "./../../login/autenticacionService.service";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
  selector: "app-calificaciones-examenes",
  templateUrl: "./calificaciones-examenes.component.html",
  styleUrls: ["./calificaciones-examenes.component.css"]
})
export class CalificacionesExamenesComponent implements OnInit {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  fechaActual: Date;
  fechaDentroDeRangoExamen: boolean = false;

  constructor(
    public estudianteService: EstudiantesService,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher,
    public authService: AutenticacionService
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.apellidoEstudiante = this.estudianteService.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.estudianteService.estudianteSeleccionado.nombre;
    this.fechaActual = new Date();
    this.fechaDentroDeRangoExamen = true;
    if (this.fechaActualEnRangoFechasExamenes()) {
      this.fechaDentroDeRangoExamen = true;
    }
  }

  fechaActualEnRangoFechasExamenes() {
    let fechaInicioExamen = new Date(
      this.authService.getFechasCicloLectivo().fechaInicioExamen
    );
    let fechaFinExamen = new Date(
      this.authService.getFechasCicloLectivo().fechaFinExamen
    );

    return (
      this.fechaActual.getTime() > fechaInicioExamen.getTime() &&
      this.fechaActual.getTime() < fechaFinExamen.getTime()
    );
  }

  guardar() {

  }
}
