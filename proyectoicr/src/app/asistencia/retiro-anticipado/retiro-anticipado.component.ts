import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit, Inject, ChangeDetectorRef } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogConfig,
  MatSnackBar,
} from "@angular/material";
import { Router } from "@angular/router";
import { MediaMatcher } from "@angular/cdk/layout";
import { SelectionModel } from "@angular/cdk/collections";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-retiro-anticipado",
  templateUrl: "./retiro-anticipado.component.html",
  styleUrls: ["./retiro-anticipado.component.css"],
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
    "nroDocumento",
  ];
  tutores: any[] = [];
  fueraPeriodoCicloLectivo = false;
  seleccion = new SelectionModel(true, []);
  isLoading = true;
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
    this.mobileQuery = media.matchMedia("(max-width: 800px)");
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
          duration: 8000,
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
        .subscribe((respuesta) => {
          this.tutores = respuesta.tutores;
          this.isLoading = false;
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
      tutoresSeleccionados: this.seleccion.selected,
    };
    let popup = this.dialog.open(RetiroPopupComponent, this.matConfig);

    popup.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.servicioAsistencia
          .registrarRetiroAnticipado(
            this._idEstudiante,
            this.antes10am,
            this.seleccion.selected
          )
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            let resultadoOperacion = response.exito;
            if (resultadoOperacion == "exito") {
              this.snackBar.open(response.message, "", {
                panelClass: ["snack-bar-exito"],
                duration: 4500,
              });
            } else {
              this.snackBar.open(response.message, "", {
                panelClass: ["snack-bar-fracaso"],
                duration: 4500,
              });
            }
          });
      }
    });
  }
}

@Component({
  selector: "app-retiro-popup",
  templateUrl: "./retiro-popup.component.html",
  styleUrls: ["./retiro-anticipado.component.css"],
})
export class RetiroPopupComponent {
  tipoPopup: string;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public dialogRef: MatDialogRef<RetiroPopupComponent>,
    public router: Router,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.tipoPopup = data.tipoPopup;
  }

  //Vuelve al menu principal
  onYesCancelarClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  //Cierra el popup y vuelve a la interfaz de retiro
  onNoCancelarConfirmarClick(): void {
    this.dialogRef.close(false);
  }

  //Confirma el retiro anticipado para el estudiante
  onYesConfirmarClick(): void {
    this.dialogRef.close(true);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
