import { OnInit, Component, OnDestroy } from "@angular/core";
import { AutenticacionService } from "./autenticacionService.service";
import { NgForm } from "@angular/forms";
import { MatSnackBar, MatDialogRef, MatDialog } from "@angular/material";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-cambiar-password",
  templateUrl: "./cambiar-password.component.html",
  styleUrls: ["./cambiar-password.component.css"]
})
export class CambiarPassword implements OnInit, OnDestroy {
  esVisible1: boolean = false;
  esVisible2: boolean = false;
  esVisible3: boolean = false;
  private unsubscribe: Subject<void> = new Subject();

  ngOnInit() {}

  constructor(
    private servicio: AutenticacionService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onGuardar(form: NgForm) {
    if (form.valid) {
      if (form.value.passwordNueva === form.value.passwordNuevaRepetida) {
        this.servicio
          .cambiarPassword(
            form.value.passwordAnterior,
            form.value.passwordNueva
          )
          .pipe(takeUntil(this.unsubscribe))
          .subscribe(response => {
            let tipoSnackBar = "snack-bar-fracaso";
            if (response.exito) {
              tipoSnackBar = "snack-bar-exito";
            }
            this.snackBar.open(response.message, "", {
              panelClass: [tipoSnackBar],
              duration: 4000
            });
            form.reset();
          });
      } else {
        this.snackBar.open("Las contraseñas ingresadas no coinciden", "", {
          panelClass: ["snack-bar-fracaso"],
          duration: 4000
        });
      }
    } else {
      if (
        !form.value.passwordAnterior ||
        !form.value.passwordNueva ||
        !form.value.passwordNuevaRepetida
      ) {
        this.snackBar.open("Faltan campos por completar", "", {
          panelClass: ["snack-bar-fracaso"],
          duration: 4000
        });
      } else {
        this.snackBar.open("Los campos ingresados no son validos", "", {
          panelClass: ["snack-bar-fracaso"],
          duration: 4000
        });
      }
    }
  }

  onVisibilidad(numeroInput: number) {
    if (numeroInput == 1) {
      this.esVisible1 = !this.esVisible1;
    } else if (numeroInput == 2) {
      this.esVisible2 = !this.esVisible2;
    } else {
      this.esVisible3 = !this.esVisible3;
    }
  }

  onCancelar() {
    this.dialog.open(CambiarPasswordPopupComponent, {
      width: "250px"
    });
  }
}

@Component({
  selector: "app-cambiar-password-popup",
  templateUrl: "./cambiar-password-popup.component.html",
  styleUrls: ["./login.component.css"]
})
export class CambiarPasswordPopupComponent {
  formInvalido: Boolean;
  tipoPopup: string;
  constructor(
    public dialogRef: MatDialogRef<CambiarPasswordPopupComponent>,
    public router: Router
  ) {}

  onYesClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
