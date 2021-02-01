import { Subscription } from "rxjs";
import { AutenticacionService } from "./login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { Router, NavigationStart,NavigationEnd } from "@angular/router";

export let browserRefresh = false;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  title = "Lie";
  subscription: Subscription;

  constructor(
    public router: Router,
    private swPush: SwPush,
    private servicio: AutenticacionService
  ) {
    this.subscription = router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        browserRefresh = !router.navigated;
      }
    });
  }

  ngOnInit(): void {
    this.servicio.autenticacionAutomatica();
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
        const contentContainer = document.querySelector('.mat-sidenav-content');
        contentContainer.scrollTo(0, 0);
    });
  }
}
