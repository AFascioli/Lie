import { OnInit, Component } from '@angular/core';
import { AutencacionService } from './autenticacionService.service';
import { NgForm } from '@angular/forms';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: "app-cambiar-contrasenia",
  templateUrl: "./cambiarcontrasenia.component.html",
  styleUrls: ["./login.component.css"]
})

export class CambiarContrasenia implements OnInit {
  ngOnInit() {
  }

  constructor(private servicio: AutencacionService,  private snackBar: MatSnackBar){
   
  }

  onGuardar(form: NgForm){
  if( form.value.contraseñaNueva === form.value.contraseñaNuevaRepetida ){
    this.servicio.cambiarContrasenia(
      form.value.contraseñaAnterior,
      form.value.contraseñaNueva    )
      console.log("entro");
    } else {
      this.snackBar.open("Las contraseñas ingresadas no coinciden", "", {
        duration: 4000
      });
      console.log("entro2");
  }
  }

}
