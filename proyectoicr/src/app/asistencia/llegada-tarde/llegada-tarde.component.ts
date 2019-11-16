import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import {
  MatSnackBar
} from "@angular/material";

@Component({
  selector: "app-llegada-tarde",
  templateUrl: "./llegada-tarde.component.html",
  styleUrls: ["./llegada-tarde.component.css"]
})
export class LlegadaTardeComponent implements OnInit {
  fechaActual: Date;
  apellidoEstudiante: string;
  nombreEstudiante: string;
  antes8am=false;
  despues8am=false;

  constructor(
    public servicio: EstudiantesService,
    public snackBar: MatSnackBar
  ) {

  }

  ngOnInit() {
    this.fechaActual = new Date();
    if(this.fechaActual.getHours()<8){
      this.antes8am=true;
    }else{
      this.despues8am=true;
    }
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
  }

  onGuardar() {
    this.snackBar.open("", "", {
      panelClass: ['snack-bar-exito'],
      duration: 4500
    });
  }
}

