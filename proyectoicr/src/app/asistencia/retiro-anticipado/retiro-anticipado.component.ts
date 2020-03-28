import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit, Inject, ChangeDetectorRef } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogConfig,
  MatSnackBar
} from "@angular/material";
import { Router } from "@angular/router";
import { MediaMatcher } from "@angular/cdk/layout";
import { SelectionModel } from "@angular/cdk/collections";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-retiro-anticipado",
  templateUrl: "./retiro-anticipado.component.html",
  styleUrls: ["./retiro-anticipado.component.css"]
})
export class RetiroAnticipadoComponent implements OnInit {
  fechaActual = new Date();
  apellidoEstudiante: string;
  nombreEstudiante: string;
  diaActual: string;
  _idEstudiante: string;
  antes10am: Boolean = true;
  matConfig = new MatDialogConfig();
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  displayedColumns: string[] = [
    "seleccion",
    "apellido",
    "nombre",
    "telefono",
    "tipoDocumento",
    "nroDocumento"
  ];
  tutores: any[] = [];
  fueraPeriodoCicloLectivo = false;
  seleccion = new SelectionModel(true, []);
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public snackBar: MatSnackBar,
    public servicioEstudiante: EstudiantesService,
    public servicioAsistencia: AsistenciaService,
    public dialog: MatDialog,
    public changeDetectorRef: ChangeDetectorRef,
    public autenticacionService: AutenticacionService,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.fechaActual = new Date();
    if (
      this.fechaActual.toString().substring(0, 3) == "Sat" ||
      this.fechaActual.toString().substring(0, 3) == "Sun"
    ) {
      this.snackBar.open(
        "Considere que está queriendo registrar un retiro anticipado en un fin de semana",
        "",
        {
          panelClass: ["snack-bar-aviso"],
          duration: 8000
        }
      );
    }
    if (
      this.fechaActualEnCicloLectivo() ||
      this.autenticacionService.getRol() == "Admin"
    ) {
      this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
      this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
      this._idEstudiante = this.servicioEstudiante.estudianteSeleccionado._id;
      this.validarHora();
      this.servicioEstudiante
        .getTutoresDeEstudiante()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(respuesta => {
          this.tutores = respuesta.tutores;
        });
    } else {
      this.fueraPeriodoCicloLectivo = true;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  fechaActualEnCicloLectivo() {
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

  //Segun que hora sea, cambia el valor de antes10am y cambia que radio button esta seleccionado
  validarHora() {
    if (this.fechaActual.getHours() >= 10) {
      this.antes10am = false;
    }
  }

  CambiarTipoRetiro() {
    this.antes10am = !this.antes10am;
  }

  openPopup(tipoPopup: string) {
    this.matConfig.data = {
      IdEstudiante: this._idEstudiante,
      antes10am: this.antes10am,
      tipoPopup: tipoPopup,
      tutoresSeleccionados: this.seleccion.selected
    };
    this.dialog.open(RetiroPopupComponent, this.matConfig);
  }
}

@Component({
  selector: "app-retiro-popup",
  templateUrl: "./retiro-popup.component.html",
  styleUrls: ["./retiro-anticipado.component.css"]
})
export class RetiroPopupComponent {
  tipoPopup: string;
  IdEstudiante: string;
  antes10am: Boolean;
  resultado: string;
  tutoresSeleccionados: Array<any>;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public dialogRef: MatDialogRef<RetiroPopupComponent>,
    public router: Router,
    public servicioAsistencia: AsistenciaService,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.tipoPopup = data.tipoPopup;
    this.IdEstudiante = data.IdEstudiante;
    this.antes10am = data.antes10am;
    this.tutoresSeleccionados = data.tutoresSeleccionados;
  }

  //Vuelve al menu principal
  onYesCancelarClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  //Cierra el popup y vuelve a la interfaz de retiro
  onNoCancelarConfirmarClick(): void {
    this.dialogRef.close();
  }

  //Confirma el retiro anticipado para el estudiante
  onYesConfirmarClick(): void {
    this.servicioAsistencia
      .registrarRetiroAnticipado(
        this.IdEstudiante,
        this.antes10am,
        this.tutoresSeleccionados
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(response => {
        this.resultado = response.exito;
        this.dialogRef.close();
        if (this.resultado == "exito") {
          this.snackBar.open(
            "Se registró correctamente el retiro anticipado para el estudiante seleccionado.",
            "",
            {
              panelClass: ["snack-bar-exito"],
              duration: 4500
            }
          );
        } else if (this.resultado == "retirado") {
          this.snackBar.open(
            "Retiro no registrado. Ya se ha registrado un retiro anticipado para el estudiante seleccionado.",
            "",
            {
              panelClass: ["snack-bar-fracaso"],
              duration: 4500
            }
          );
        } else if (this.resultado == "ausente") {
          this.snackBar.open(
            "Retiro no registrado. El estudiante esta ausente para el día de hoy.",
            "",
            {
              panelClass: ["snack-bar-fracaso"],
              duration: 4500
            }
          );
        } else {
          this.snackBar.open(
            "Retiro no registrado. El estudiante no tiene registrada la asistencia para el día de hoy.",
            "",
            {
              panelClass: ["snack-bar-fracaso"],
              duration: 4500
            }
          );
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
