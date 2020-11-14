import { ReportesService } from './reportes.service';
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-reportes",
  templateUrl: "./reportes.component.html",
  styleUrls: ["./reportes.component.css"],
})
export class ReportesComponent implements OnInit {
  constructor(public router: Router, public servicioReporte: ReportesService) {}

  ngOnInit(): void {}

  onListadoDocsAdeudados() {
    this.router.navigate(["./documentosAdeudados"]);
  }

  onListadoCuotasAdeudadas() {
    this.router.navigate(["./cuotasAdeudadas"]);
  }

  onResumenAcademico() {
    this.servicioReporte.cursoSeleccionado=null;
    this.servicioReporte.retornoDeResumenAcademico=false;
    this.router.navigate(["./resumenAcademico"]);
  }

  onRendimientoCurso() {
    this.router.navigate(["./rendimientoCurso"]);
  }
}
