import { EstudiantesService } from "./../../estudiantes/estudiante.service";
import { Component, OnInit, Inject } from "@angular/core";
import { DateAdapter, MatSnackBar } from "@angular/material";
import { NgForm } from "@angular/forms";
import {
  MatDialogRef,
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogConfig
} from "@angular/material";
import { Router } from "@angular/router";

@Component({
  selector: "app-justificacion-inasistencia",
  templateUrl: "./justificacion-inasistencia.component.html",
  styleUrls: ["./justificacion-inasistencia.component.css"]
})
export class JustificacionInasistenciaComponent implements OnInit {
  fechaActual = new Date();
  fechaUnica = new Date();
  fechaInicio = new Date();
  fechaFin = new Date();
  esMultiple: boolean = false;
  ultimasInasistencias = [];
  inasistenciasAJustificar = [];

  constructor(
    private servicio: EstudiantesService,
    public snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.servicio.obtenerUltimasInasistencias().subscribe(response => {
      this.ultimasInasistencias = response.inasistencias;
    });
  }

  justificarInasistencia() {
    this.servicio
      .justificarInasistencia(this.ultimasInasistencias)
      .subscribe(response => {
        let tipoSnackBar = "snack-bar-fracaso";
        if (response.exito) {
          tipoSnackBar = "snack-bar-exito";
        }
        this.snackBar.open(response.message, "", {
          panelClass: [tipoSnackBar],
          duration: 4500
        });
        this.ngOnInit();
      });
  }

  //Con el indice, cambia el valor del campo justificado de la inasistencia
  onChecked(index: number) {
    this.ultimasInasistencias[index].justificado = !this.ultimasInasistencias[
      index
    ].justificado;
  }

  onCancelar() {
    this.dialog.open(JustificacionInasistenciaPopupComponent, {
      width: "250px"
    });
  }
}

@Component({
  selector: "app-justificacion-inasistencia-popup",
  templateUrl: "./justificacion-inasistencia-popup.component.html",
  styleUrls: ["./justificacion-inasistencia.component.css"]
})
export class JustificacionInasistenciaPopupComponent {
  formInvalido: Boolean;
  tipoPopup: string;
  constructor(
    public dialogRef: MatDialogRef<JustificacionInasistenciaPopupComponent>,
    public router: Router
  ) {}

  onYesClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
