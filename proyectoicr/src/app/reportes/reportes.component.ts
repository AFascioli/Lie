import { ReportesService } from "./reportes.service";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AutenticacionService } from '../login/autenticacionService.service';

@Component({
  selector: "app-reportes",
  templateUrl: "./reportes.component.html",
  styleUrls: ["./reportes.component.css"],
})
export class ReportesComponent implements OnInit {
  esDocente:boolean=false;
  constructor(
    public router: Router,
    public servicioReporte: ReportesService,
    public servicioAutenticacion: AutenticacionService
  ) {}

  ngOnInit(): void {
    if(this.servicioAutenticacion.getRol()=='Docente')
    this.esDocente = true;
  }

  onListadoDocsAdeudados() {
    this.router.navigate(["./documentosAdeudados"]);
  }

  onListadoCuotasAdeudadas() {
    this.router.navigate(["./cuotasAdeudadas"]);
  }

  onResumenAcademico() {
    this.servicioReporte.cursoSeleccionado = null;
    this.servicioReporte.retornoDeResumenAcademico = false;
    this.router.navigate(["./resumenAcademico"]);
  }

  onRendimientoCurso() {
    this.router.navigate(["./rendimientoCurso"]);
  }

  onPromedioCursos() {
    this.router.navigate(["./promedioCursos"]);
  }
}
