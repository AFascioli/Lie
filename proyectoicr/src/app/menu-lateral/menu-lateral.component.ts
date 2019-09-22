import { MatDialog, MatDialogRef } from "@angular/material";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AutenticacionService } from "../login/autenticacionService.service";
import { EstudiantesService } from '../estudiantes/estudiante.service';

@Component({
  selector: "app-menu-lateral",
  templateUrl: "./menu-lateral.component.html",
  styleUrls: ["./menu-lateral.component.css"]
})
export class MenuLateralComponent implements OnInit {
  constructor(
    public router: Router,
    public authService: AutenticacionService,
    public dialog: MatDialog,
    public estudianteService: EstudiantesService
  ) {}

  ngOnInit() {}

  onClickHome() {
    this.router.navigate(["./home"]);
  }

  cierreSesion() {
    // this.authService.logout();
    // this.router.navigate(["./login"]);
    this.dialog.open(CerrarSesionPopupComponent, {
      width: "250px"
    });
  }

  cambiarContrasenia() {
    this.router.navigate(["/cambiarContraseña"]);
  }

}

@Component({
  selector: "app-cerrar-sesion-popup",
  templateUrl: "./cerrar-sesion-popup.component.html",
  styleUrls: ["./menu-lateral.component.css"]
})
export class CerrarSesionPopupComponent {
  formInvalido: Boolean;
  tipoPopup: string;
  constructor(
    public dialogRef: MatDialogRef<CerrarSesionPopupComponent>,
    public router: Router,
    public authService: AutenticacionService
  ) {}

  onYesClick(): void {
    this.dialogRef.close();
    this.authService.logout();
    this.router.navigate(["./login"]);
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
