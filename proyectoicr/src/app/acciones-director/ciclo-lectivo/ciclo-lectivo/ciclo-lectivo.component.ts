import { EmpleadoService } from "./../../../empleado/empleado.service";
import { Component, OnInit, Inject } from "@angular/core";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";

export interface DialogData {
  name: string;
  resultYes: boolean;
}

@Component({
  selector: "app-ciclo-lectivo",
  templateUrl: "./ciclo-lectivo.component.html",
  styleUrls: ["./ciclo-lectivo.component.css"],
})
export class CicloLectivoComponent implements OnInit {
  iniciarCursado: Boolean = true;
  primerTrimestre: Boolean;
  segundoTrimestre: Boolean;
  tercerTrimestre: Boolean;
  fechasExamen: Boolean;
  name: string;
  id;

  constructor(public dialog: MatDialog) {}

  openPopUp(): void {
    const dialogRef = this.dialog.open(PopUpCerrarEtapa, {
      width: "250px",
      data: { name: this.name },
    });

    dialogRef.afterClosed().subscribe((result) => {
      switch (this.id) {
        case 1:
          this.primerTrimestre = true;
          this.iniciarCursado = false;
          break;
        case 2:
          this.segundoTrimestre = true;
          this.primerTrimestre = false;
          break;
        case 3:
          this.tercerTrimestre = true;
          this.segundoTrimestre = false;
          break;
        case 4:
          this.fechasExamen = true;
          this.tercerTrimestre = false;
          break;
        case 5:
          this.iniciarCursado = true;
          this.fechasExamen = false;
          break;
      }
    });
  }

  ngOnInit(): void {
  }

  onCierreInicioCursado() {
    this.id = 1;
    this.name = "iniciar el ciclo lectivo";
    this.openPopUp();
  }

  onCierrePrimerTrimestre() {
    this.id = 2;
    this.name = "cerrar el primer trimestre";
    this.openPopUp();
  }

  onCierreSegundoTrimestre() {
    this.id = 3;
    this.name = "cerrar el segundo trimestre";
    this.openPopUp();
  }

  onCierreTercerTrimestre() {
    this.id = 4;
    this.name = "cerrar el tercer trimestre";
    this.openPopUp();
  }

  onCierreExamenes() {
    this.id = 5;
    this.name = "finalizar las fechas de exámen";
    this.openPopUp();
  }
}

@Component({
  selector: "popUp-cerrarEtapa",
  templateUrl: "../popUp-cerrarEtapa.html",
  styleUrls: ["../ciclo-lectivo/ciclo-lectivo.component.css"],
})
export class PopUpCerrarEtapa {
  constructor(
    public dialogRef: MatDialogRef<PopUpCerrarEtapa>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onNoClick(): void {
    this.data.resultYes = false;
    this.dialogRef.close();
  }
  onYesClick() {
    this.data.resultYes = true;
    this.dialogRef.close();
  }
}
