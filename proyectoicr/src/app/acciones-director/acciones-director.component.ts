import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-acciones-director",
  templateUrl: "./acciones-director.component.html",
  styleUrls: ["./acciones-director.component.css"],
})
export class AccionesDirectorComponent implements OnInit {
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(public router: Router) {}

  ngOnInit(): void {}

  onClickEstadoCursos() {
    this.router.navigate(["./estadoCursos"]);
  }
  onClickCicloLectivo() {
    this.router.navigate(["./estadoCicloLectivo"]);
  }
  onClickReglasDeNegocio() {
    this.router.navigate(["./reglasDeNegocio"]);
  }
}
