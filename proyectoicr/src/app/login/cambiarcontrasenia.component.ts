import { OnInit, Component } from '@angular/core';
import { AutencacionService } from './autenticacionService.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: "app-cambiar-contrasenia",
  templateUrl: "./cambiarcontrasenia.component.html",
  styleUrls: ["./login.component.css"]
})

export class CambiarContrasenia implements OnInit {
  ngOnInit() {
  }

  constructor(private servicio: AutencacionService){

  }

  onGuardar(form: NgForm){
  if( form.value.contraseñaNueva === form.value.contraseñaNuevaRepetida ){
    this.servicio.cambiarContrasenia(
      form.value.contraseñaAnterior,
      form.value.contraseñaNueva    )
    }
  }
  //else snackbar
}
