import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: 'app-volver-popup',
  templateUrl: './volver-popup.component.html',
  styleUrls: ['./volver-popup.component.css']
})
export class VolverPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<VolverPopupComponent>,
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
