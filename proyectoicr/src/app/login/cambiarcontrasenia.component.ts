import { OnInit, Component } from "@angular/core";
import { AutencacionService } from "./autenticacionService.service";
import { NgForm } from "@angular/forms";
import { MatSnackBar, MatDialogRef, MatDialog } from "@angular/material";
import { Router } from '@angular/router';

@Component({
  selector: "app-cambiar-contrasenia",
  templateUrl: "./cambiarcontrasenia.component.html",
  styleUrls: ["./login.component.css"]
})
export class CambiarContrasenia implements OnInit {
  esVisible1: boolean=false;
  esVisible2: boolean=false;
  esVisible3: boolean=false;

  ngOnInit() {}

  constructor(
    private servicio: AutencacionService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  onGuardar(form: NgForm) {
    if(form.valid){
      if (form.value.contraseñaNueva === form.value.contraseñaNuevaRepetida) {
        this.servicio.cambiarContrasenia(
          form.value.contraseniaAnterior,
          form.value.contraseñaNueva
        ).subscribe(response=> {
          this.snackBar.open(response.message, "", {
            duration: 4000
          });
        });
      } else {
        this.snackBar.open("Las contraseñas ingresadas no coinciden", "", {
          duration: 4000
        });
      }
    }else{

      if(!form.value.contraseniaAnterior || !form.value.contraseniaNueva || !form.value.contraseñaNuevaRepetida ){
        this.snackBar.open("Faltan campos por completar", "", {
          duration: 4000
          });
      } else {
         this.snackBar.open("Los campos ingresados no son validos", "", {
        duration: 4000
        });
      }

    }
  }

  onVisibilidad(numeroInput: number){
    if(numeroInput==1){
      this.esVisible1= !this.esVisible1;
    }else if(numeroInput==2){

      this.esVisible2= !this.esVisible2;
    }else{
      this.esVisible3= !this.esVisible3;
    }
  }

  onCancelar(){
    this.dialog.open(CambiarPasswordPopupComponent, {
        width: "250px"
      });
    }
}

@Component({
  selector: "app-cambiar-password-popup",
  templateUrl: "./cambiar-password-popup.component.html",
  styleUrls: ['./login.component.css']
})
export class CambiarPasswordPopupComponent {
  formInvalido : Boolean;
      tipoPopup :  string;
  constructor(
        public dialogRef: MatDialogRef<CambiarPasswordPopupComponent>, public router: Router
      ) {}

      onYesClick():void{
        this.router.navigate(['./home']);
        this.dialogRef.close();
      }
      onNoClick(): void {
        this.dialogRef.close();
      }

    }

