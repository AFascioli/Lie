import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";

@Component({
  selector: "app-menu-lateral",
  templateUrl: "./menu-lateral.component.html",
  styleUrls: ["./menu-lateral.component.css"]
})
export class MenuLateralComponent implements OnInit {
  panelOpenState = false;
  @ViewChild('drawer',{static: false}) drawer: ElementRef<any>;

  onClick() {
    (this.drawer.nativeElement.value).toggle();
  }


  constructor() { }

  ngOnInit() {}
}
