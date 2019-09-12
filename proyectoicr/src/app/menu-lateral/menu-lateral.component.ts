import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { Router } from '@angular/router';
import { AutencacionService } from '../login/autenticacionService.service';

@Component({
  selector: "app-menu-lateral",
  templateUrl: "./menu-lateral.component.html",
  styleUrls: ["./menu-lateral.component.css"]
})
export class MenuLateralComponent implements OnInit {
  constructor( public router: Router, public authService: AutencacionService) { }

  ngOnInit() {}

  onClickHome() {
    this.router.navigate(["./home"]);
  }

  cierreSesion(){
    this.authService.logout();
    this.router.navigate(["./login"]);
  }

  cambiarContrasenia(){
    this.router.navigate(["/cambiarContraseña"]);
  }

  }



