import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { EstudiantesService } from "../estudiantes/estudiante.service";
import { Estudiante } from "../estudiantes/estudiante.model";
import { Router } from "@angular/router";
import {
  MatDialogRef,
  MatDialog,
  MatGridTileHeaderCssMatStyler,
} from "@angular/material";
import { MediaMatcher } from "@angular/cdk/layout";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AutenticacionService } from "../login/autenticacionService.service";

@Component({
  selector: "app-perfil-estudiante",
  templateUrl: "./perfil-estudiante.component.html",
  styleUrls: ["./perfil-estudiante.component.css"],
})
export class PerfilEstudianteComponent implements OnInit {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  estudiantes: Estudiante[] = [];
  _idEstudiante: string;
  suspendido: Boolean;
  idUsuario: string;
  calificacionesSelected: boolean;
  aniosCiclos;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public servicio: EstudiantesService,
    public servicioAutenticación: AutenticacionService,
    public servicioCicloLectivo: CicloLectivoService,
    public router: Router,
    public popup: MatDialog,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 880px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.servicioCicloLectivo
      .obtenerActualYSiguiente()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.aniosCiclos = response.añosCiclos;
      });

    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicio.estudianteSeleccionado._id;

    this.servicio
      .esEstudianteSuspendido(this._idEstudiante)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.suspendido = response.exito;
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  esAdultoResponsable() {
    return this.servicioAutenticación.getRol() == "AdultoResponsable";
  }

  onCancelar() {
    this.popup.open(PerfilEstudiantePopupComponent);
  }

  onClickCalificaciones() {
    this.router.navigate(["./calificacionesPerfilEstudiante"]);
  }

  onClickInasistencias() {
    this.router.navigate(["./inasistenciasPerfilEstudiante"]);
  }

  onClickCuotas() {
    this.router.navigate(["./cuotasPerfilEstudiante"]);
  }

  onClickHorarios() {
    this.router.navigate(["./agendaCursoPerfilEstudiante"]);
  }

  onClickSanciones() {
    this.router.navigate(["./sancionesPerfilEstudiante"]);
  }

  onClickTutores() {
    this.router.navigate(["./tutoresPerfilEstudiante"]);
  }

  onClickDatosEstudiante() {
    this.router.navigate(["./datosPerfilEstudiante"]);
  }

  onClickSolicitudReunion() {
    this.router.navigate(["/solicitudReunionAR"]);
  }
}
@Component({
  selector: "app-perfil-estudiante-popup",
  templateUrl: "./perfil-estudiante-popup.component.html",
  styleUrls: ["./perfil-estudiante.component.css"],
})
export class PerfilEstudiantePopupComponent {
  constructor(
    public dialogRef: MatDialogRef<PerfilEstudiantePopupComponent>,
    public router: Router
  ) {}

  onYesCancelarClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  onNoCancelarClick(): void {
    this.dialogRef.close();
  }
}
