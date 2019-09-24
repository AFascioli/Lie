import { CambiarPassword } from './../login/cambiar-password.component';
import { MatDialog, MatDialogRef, MatDrawer, MatSidenav } from "@angular/material";
import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { AutenticacionService } from "../login/autenticacionService.service";
import { EstudiantesService } from '../estudiantes/estudiante.service';
import { MediaMatcher } from '@angular/cdk/layout';

@Component({
  selector: "app-menu-lateral",
  templateUrl: "./menu-lateral.component.html",
  styleUrls: ["./menu-lateral.component.css"]
})
export class MenuLateralComponent implements OnInit {
  //Lo inicializo porque sino salta error en la consola del browser
  permisos={
    notas:0,
    asistencia:0,
    eventos:0,
    sanciones:0,
    agendaCursos:0,
    inscribirEstudiante:0,
    registrarEmpleado:0,
    registrarCuota:0
  };
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  //Basicamente tenemos comportamiento que se fija si el display es menor a 600 px o no
  constructor(
    public router: Router,
    public authService: AutenticacionService,
    public dialog: MatDialog,
    public estudianteService: EstudiantesService,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.authService.obtenerPermisosDeRol().subscribe(response=>{
      this.permisos=response.permisos;
    });
  }

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

  cambiarPassword() {
    this.router.navigate(["/cambiarContraseña"]);
  }

  cerrarMenuLateral(sideNav: MatSidenav){
    if(this.mobileQuery.matches){
      sideNav.toggle();
    }
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
