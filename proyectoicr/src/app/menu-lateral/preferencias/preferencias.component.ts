import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-preferencias',
  templateUrl: './preferencias.component.html',
  styleUrls: ['./preferencias.component.css']
})
export class PreferenciasComponent implements OnInit {
  notificaciones: boolean;

  constructor(public router: Router) { }

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
}
