import { MatDialogRef } from "@angular/material";
import { Router } from "@angular/router";
import { Component } from "@angular/core";

@Component({
  selector: "app-cancel-popup",
  templateUrl: "./cancel-popup.component.html",
  styleUrls: ["../estudiantes/alta-estudiantes/alta-estudiantes.component.css"]
})
export class CancelPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<CancelPopupComponent>,
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
