import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-preferencias',
  templateUrl: './preferencias.component.html',
  styleUrls: ['./preferencias.component.css']
})
export class PreferenciasComponent implements OnInit {


  constructor(public router: Router) { }

  ngOnInit() {
  }

  cambiarPassword() {
    this.router.navigate(["/cambiarContraseña"]);
  }
}
