import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { MatDialogRef, MatDialog } from "@angular/material";
import { Router } from "@angular/router";


@Component({
  selector: 'app-llegada-tarde',
  templateUrl: './llegada-tarde.component.html',
  styleUrls: ['./llegada-tarde.component.css']
})
export class LlegadaTardeComponent implements OnInit {
  fechaActual = new Date();
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;
  antes10am: Boolean = true;
  ///matConfig = new MatDialogConfig();
  constructor(private servicio: EstudiantesService, public popup: MatDialog) { }

  ngOnInit() {
    this.fechaActual = new Date();
    //this.apellidoEstudiante= this.servicio.estudianteSeleccionado.apellido;
    //this.nombreEstudiante= this.servicio.estudianteSeleccionado.nombre;
    //this._idEstudiante= this.servicio.estudianteSeleccionado._id;
    //this.validarHora();

  }

}
