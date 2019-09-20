import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from '../estudiante.service';
import { Estudiante } from '../estudiante.model';
import { Router } from '@angular/router';

@Component({
  selector: "app-lista-estudiantes",
  templateUrl: "./lista-estudiantes.component.html",
  styleUrls: ["./lista-estudiantes.component.css"]
})

export class ListaEstudiantesComponent implements OnInit {
  dniSeleccionado: number;
  estudiantes: Estudiante[] = [];
  displayedColumns: string[] = ["apellido", "nombre", "tipo", "numero", "accion"];

  constructor(public servicio: EstudiantesService, public router: Router) {}

  ngOnInit() {
    this.servicio.getEstudiantesListener().subscribe(estudiantesBuscados =>{
      this.estudiantes = estudiantesBuscados;
    });

    if(this.servicio.retornoDesdeAcciones)
    {
      this.servicio.retornoDesdeAcciones=false;
    }
  }

  onInscribir(indice){
    this.servicio.estudianteSeleccionado = (this.estudiantes.find(estudiante => estudiante.numeroDocumento===this.estudiantes[indice].numeroDocumento));
    this.router.navigate(["./curso"]);
    this.servicio.retornoDesdeAcciones=true;
  }

  onMostrar(indice){
    this.servicio.estudianteSeleccionado = (this.estudiantes.find(estudiante => estudiante.numeroDocumento===this.estudiantes[indice].numeroDocumento));
    this.router.navigate(["./mostrar"]);
    this.servicio.retornoDesdeAcciones=true;
  }

  onRetiro(indice){
    this.servicio.estudianteSeleccionado = (this.estudiantes.find(estudiante => estudiante.numeroDocumento===this.estudiantes[indice].numeroDocumento));
    this.router.navigate(["./retiroAnticipado"]);
    this.servicio.retornoDesdeAcciones=true;
  }

    onVisualizarPerfil(indice){
    this.servicio.estudianteSeleccionado = (this.estudiantes.find(estudiante => estudiante.numeroDocumento===this.estudiantes[indice].numeroDocumento));
    this.router.navigate(["./perfilEstudiante"]);
    this.servicio.retornoDesdeAcciones=true;
  }

  onJustificar(indice){
    this.servicio.estudianteSeleccionado = (this.estudiantes.find(estudiante => estudiante.numeroDocumento===this.estudiantes[indice].numeroDocumento));
    this.router.navigate(["./justificarInasistencia"]);
    this.servicio.retornoDesdeAcciones=true;
  }


}

