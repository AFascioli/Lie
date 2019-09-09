import { Component, OnInit} from '@angular/core';
import { AutencacionService } from './autenticacionService.service';
import { MatSnackBar } from '@angular/material';
import { async } from 'q';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email: string;
  password: string;

  constructor( public authService: AutencacionService,  private snackBar: MatSnackBar) { }

  ngOnInit() {

  }

  iniciarSesion(){
    if(this.password && this.email){
      let respuesta=  this.authService.login(this.email, this.password);
      console.log(respuesta);
        this.snackBar.open(respuesta, "", {
          duration: 4000
        });
     }
  else{
    this.snackBar.open("Faltan campos por completar", "", {
      duration: 4000
    });
      }
  }
}
