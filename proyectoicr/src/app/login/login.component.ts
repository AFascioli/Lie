import { Component, OnInit, OnDestroy } from "@angular/core";
import { AutenticacionService } from "./autenticacionService.service";
import { MatSnackBar } from "@angular/material";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent implements OnDestroy {
  email: string;
  password: string;
  private unsubscribe: Subject<void> = new Subject();
  constructor(
    public authService: AutenticacionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  iniciarSesion() {
    if (this.password && this.email) {
      this.authService
        .login(this.email, this.password)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(respuesta => {
          let tipoSnackBar = "snack-bar-fracaso";
          if (respuesta.exito) {
            tipoSnackBar = "snack-bar-exito";
          }
          this.snackBar.open(respuesta.message, "", {
            panelClass: [tipoSnackBar],
            duration: 4000
          });
        });
    } else {
      this.snackBar.open("Faltan campos por completar", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4000
      });
    }
  }
}
