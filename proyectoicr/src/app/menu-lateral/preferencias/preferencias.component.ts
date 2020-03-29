import { OnDestroy } from "@angular/core";
import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-preferencias",
  templateUrl: "./preferencias.component.html",
  styleUrls: ["./preferencias.component.css"]
})
export class PreferenciasComponent implements OnInit, OnDestroy {
  notificaciones: boolean;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public router: Router,
    public popup: MatDialog,
    public snackBar: MatSnackBar,
    public servicio: AutenticacionService
  ) {}

  //#resolve, este valor lo tiene que buscar de la bd
  ngOnInit() {
    this.notificaciones = true;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  cambiarPassword() {
    this.router.navigate(["/cambiarContraseña"]);
  }

  onCambioPreferenciaSuscripcion() {
    this.notificaciones = !this.notificaciones;
  }

  onCancelar() {
    this.popup.open(PreferenciasPopupComponent);
  }

  //#resolve, falta corroborar contra la bd
  onGuardar() {
    this.snackBar.open(
      "Se han guardado las configuraciones de manera exitosa",
      "",
      {
        panelClass: ["snack-bar-exito"],
        duration: 4500
      }
    );
  }

  pruebaNotificacion() {
    this.servicio
      .pruebaNotificacion()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(res => {
        console.log(res);
      });
  }
}

@Component({
  selector: "app-preferencias-popup",
  templateUrl: "./preferencias-popup.component.html",
  styleUrls: ["./preferencias.component.css"]
})
export class PreferenciasPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<PreferenciasPopupComponent>,
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
