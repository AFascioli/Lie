import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

username: string;
password: string;

  constructor() { }

  ngOnInit() {
  }




login() : void {
  if(this.username == 'admin' && this.password == 'admin'){
  }else {
    alert("Invalid credentials");
  }
}
}
