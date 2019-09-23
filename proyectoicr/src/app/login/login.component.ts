import { Component, OnInit } from "@angular/core";
import { AutenticacionService } from "./autenticacionService.service";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent implements OnInit {
  email: string;
  password: string;

  constructor(
    public authService: AutenticacionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
  }

  iniciarSesion() {
    if (this.password && this.email) {
      this.authService.login(this.email, this.password).subscribe(respuesta => {
        this.snackBar.open(respuesta, "", {
          duration: 4000
        });
      });
    } else {
      this.snackBar.open("Faltan campos por completar", "", {
        duration: 4000
      });
    }
  }
}
