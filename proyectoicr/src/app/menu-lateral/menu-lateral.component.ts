import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { Router } from '@angular/router';

@Component({
  selector: "app-menu-lateral",
  templateUrl: "./menu-lateral.component.html",
  styleUrls: ["./menu-lateral.component.css"]
})
export class MenuLateralComponent implements OnInit {
  constructor( public router: Router) { }

  ngOnInit() {}

  onClickHome() {
    this.router.navigate(["./home"]);
  }

  }



