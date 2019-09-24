import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";


@Component({
  selector: 'app-alta-empleado',
  templateUrl: './alta-empleado.component.html',
  styleUrls: ['./alta-empleado.component.css']
})
export class AltaEmpleadoComponent implements OnInit {

  constructor(
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
  }

  popUpCancelar() {
    this.dialog.open(AltaEmpleadoPopupComponent, {
      width: "250px"
    });
  }

}

@Component({
  selector: 'app-alta-empleado-popup',
  templateUrl: './alta-empleado-popup.component.html',
  styleUrls: ['./alta-empleado.component.css']
})
export class AltaEmpleadoPopupComponent  {

  constructor(
    public dialogRef: MatDialogRef<AltaEmpleadoPopupComponent>,
    public router: Router
  ) { }

  onYesClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }

}
