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

  radioButtonChange(){
    this.antes8am= !this.antes8am;
    this.despues8am= !this.despues8am;
  }

  onGuardar() {
    this.servicio.registrarLlegadaTarde(this.antes8am).subscribe(result =>{
    if(result.exito){
      this.snackBar.open(result.message, "", {
        panelClass: ['snack-bar-exito'],
        duration: 4500
      });
    }
    else{
      this.snackBar.open(result.message, "", {
        panelClass: ['snack-bar-fracaso'],
        duration: 4500
      });
    }
    })
  }
}

