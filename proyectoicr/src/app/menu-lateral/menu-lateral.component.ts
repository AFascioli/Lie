import { CambiarPassword } from "./../login/cambiar-password.component";
import {
  MatDialog,
  MatDialogRef,
  MatDrawer,
  MatSidenav,
} from "@angular/material";
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  QueryList,
  ViewChildren,
} from "@angular/core";
import { Router } from "@angular/router";
import { AutenticacionService } from "../login/autenticacionService.service";
import { EstudiantesService } from "../estudiantes/estudiante.service";
import { MediaMatcher } from "@angular/cdk/layout";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-menu-lateral",
  templateUrl: "./menu-lateral.component.html",
  styleUrls: ["./menu-lateral.component.css"],
})
export class MenuLateralComponent implements OnInit, OnDestroy {
  rol: string;
  usuario: string;
  apellidoNombre: string;
  private unsubscribe: Subject<void> = new Subject();
  //Lo inicializo porque sino salta error en la consola del browser
  permisos = {
    notas: 0,
    asistencia: 0,
    eventos: 0,
    sanciones: 0,
    agendaCursos: 0,
    inscribirEstudiante: 0,
    registrarEmpleado: 0,
    cuotas: 0,
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
    this.mobileQuery = media.matchMedia("(max-width: 1000px)"); //Estaba en 800, lo tiro a 1000
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit() {
    this.authService
      .obtenerPermisosDeRol()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.permisos = response.permisos;
      });
    // this.authService.obtenerNombreApellido().subscribe((user) => {
    //   this.apellidoNombre=user.usuario.apellido + " " + user.usuario.nombre;
    // });

    this.rol = this.authService.getRol();
    this.usuario = this.authService.getUsuarioAutenticado();
  }

  onClickHome() {
    this.router.navigate(["./home"]);
  }

  cierreSesion() {
    let popup = this.dialog.open(CerrarSesionPopupComponent, {
      width: "250px",
    });

    popup.afterClosed().subscribe((resultado) => {
      if(resultado){
        this.authService.logout();
        this.router.navigate(["./login"]);
      }
    });
  }

  cerrarMenuLateral(sideNav: MatSidenav) {
    this.estudianteService.retornoDesdeAcciones = false;
    if (this.mobileQuery.matches) {
      sideNav.toggle();
    }
  }
}

@Component({
  selector: "app-cerrar-sesion-popup",
  templateUrl: "./cerrar-sesion-popup.component.html",
  styleUrls: ["./menu-lateral.component.css"],
})
export class CerrarSesionPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<CerrarSesionPopupComponent>
  ) {}

  onYesClick(): void {
    this.dialogRef.close(true);
  }
  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
