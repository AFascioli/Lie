import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-preferencias',
  templateUrl: './preferencias.component.html',
  styleUrls: ['./preferencias.component.css']
})
export class PreferenciasComponent implements OnInit {
  notificaciones: boolean;

  constructor(public router: Router,
      public popup: MatDialog,
      public snackBar: MatSnackBar) { }

  //#resolve, este valor lo tiene que buscar de la bd
  ngOnInit() {
    this.notificaciones= true;
  }

  cambiarPassword() {
    this.router.navigate(["/cambiarContraseña"]);
  }

  onCambioPreferenciaSuscripcion(){
    this.notificaciones = !this.notificaciones;
  }

  onCancelar(){
    this.popup.open(PreferenciasPopupComponent);
  }

  //#resolve, falta corroborar contra la bd
  onGuardar(){
    this.snackBar.open("Se han guardado las configuraciones de manera exitosa", "", {
      panelClass: ['snack-bar-exito'],
      duration: 4500,
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
