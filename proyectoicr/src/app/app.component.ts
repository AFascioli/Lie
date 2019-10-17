import { AutenticacionService } from "./login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { Router } from "@angular/router";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  title = "Lie";

  constructor(public router: Router, private swPush: SwPush, private servicio: AutenticacionService) {}
  ngOnInit(): void {
    this.servicio.autenticacionAutomatica();
    // #resolve
    this.swPush.notificationClicks.subscribe(({ action, notification }) => {
      switch (action) {
        case "home":
          console.log('Acción home');
          // this.router.navigate(["./home"]);
          break;

        default:
          alert("Acción en notificación no definida.");
      }
    });
  }
}
