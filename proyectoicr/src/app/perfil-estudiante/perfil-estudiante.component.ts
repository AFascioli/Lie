import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { EstudiantesService } from "../estudiantes/estudiante.service";
import { Estudiante } from '../estudiantes/estudiante.model';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialog } from '@angular/material';
import { MediaMatcher } from '@angular/cdk/layout';


@Component({
  selector: 'app-perfil-estudiante',
  templateUrl: './perfil-estudiante.component.html',
  styleUrls: ['./perfil-estudiante.component.css']
})
export class PerfilEstudianteComponent implements OnInit {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  estudiantes: Estudiante[] = [];
  _idEstudiante: string;
  idUsuario: string;
  calificacionesSelected: boolean;
  fechaActual: Date;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(
    public servicio: EstudiantesService,
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
    this.fechaActual = new Date();
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicio.estudianteSeleccionado._id;
  }

  onCancelar(){
    this.popup.open(PerfilEstudiantePopupComponent);
  }

  onClickCalificaciones(){
    this.router.navigate(["./calificacionesPerfilEstudiante"]);
  }

  onClickInasistencias(){
    this.router.navigate(["./inasistenciasPerfilEstudiante"]);
  }

  onClickCuotas(){
    this.router.navigate(["./cuotasPerfilEstudiante"]);
  }

  onClickHorarios(){
    this.router.navigate(["./agendaCursoPerfilEstudiante"]);
  }

  onClickSanciones(){
    this.router.navigate(["./sancionesPerfilEstudiante"]);
  }

  onClickTutores(){
    this.router.navigate(["./tutoresPerfilEstudiante"]);
  }

  onClickDatosEstudiante(){
    this.router.navigate(["./datosPerfilEstudiante"]);
  }

}
  @Component({
    selector: "app-perfil-estudiante-popup",
    templateUrl: "./perfil-estudiante-popup.component.html",
    styleUrls: ["./perfil-estudiante.component.css"]
  })
  export class PerfilEstudiantePopupComponent {
    constructor(
      public dialogRef: MatDialogRef<PerfilEstudiantePopupComponent>,
      public router: Router,
      public servicio: EstudiantesService
    ) {}

    onYesCancelarClick(): void {
      this.router.navigate(["./home"]);
      this.dialogRef.close();
    }

    onNoCancelarClick(): void {
      this.dialogRef.close();
    }
  }


