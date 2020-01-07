import { MatDialogRef } from "@angular/material";
import { Router } from "@angular/router"
import { Component } from '@angular/core';

@Component({
  selector: "app-alta-popup",
  templateUrl: "./alta-popup.component.html",
  styleUrls: ["../estudiantes/alta-estudiantes/alta-estudiantes.component.css"]
})
export class AltaPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<AltaPopupComponent>,
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
