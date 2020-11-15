import { CicloLectivoService } from "./../../../cicloLectivo.service";
import { Component, OnInit, Inject } from "@angular/core";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material";

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
  iniciarCursado: Boolean;
  primerTrimestre: Boolean = true;
  segundoTrimestre: Boolean;
  tercerTrimestre: Boolean;
  fechasExamen: Boolean;
  name: string;
  id;

  constructor(
    public dialog: MatDialog,
    public servicioCicloLectivo: CicloLectivoService,
    private snackBar: MatSnackBar
  ) {}

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
          this.cerrarTrimestre(1);
          break;
        case 3:
          this.tercerTrimestre = true;
          this.segundoTrimestre = false;
          this.cerrarTrimestre(2);
          break;
        case 4:
          this.fechasExamen = true;
          this.tercerTrimestre = false;
          this.cerrarTrimestre(3);
          break;
        case 5:
          this.iniciarCursado = true;
          this.fechasExamen = false;
          this.cerrarEtapaExamenes();
          break;
      }
    });
  }

  ngOnInit(): void {}

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

  cerrarEtapaExamenes() {
    this.servicioCicloLectivo.cierreEtapaExamenes().subscribe((response) => {
      if (response.exito) {
        this.showSnackbar(response.message, "snack-bar-exito");
      }else{
        this.showSnackbar(response.message, "snack-bar-fracaso");
      }
    });
  }

  cerrarTrimestre(trimestre) {
    this.servicioCicloLectivo.cierreTrimestre(trimestre).subscribe((response) => {
      if (response.exito) {
        this.showSnackbar(response.message, "snack-bar-exito");
      }else{
        let cursosYMaterias;
        for (const cursoYMateria of response.materiasSinCerrar) {
          cursosYMaterias+=`${cursoYMateria.materia} de ${cursoYMateria.curso}, `
        }
        let mensaje= response.message+cursosYMaterias.slice(0, cursosYMaterias.length-2);
        this.dialog.open(PopUpMateriasSinCerrar, {
          width: "250px",
          data: { mensaje: mensaje },
        });
      }
    });
  }

  showSnackbar(mensaje, tipo) {
    this.snackBar.open(
      mensaje,
      "",
      {
        panelClass: [tipo],
        duration: 4000,
      }
    );
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

@Component({
  selector: "popUp-materiasSinCerrar",
  templateUrl: "../popUp-materiasSinCerrar.html",
  styleUrls: ["../ciclo-lectivo/ciclo-lectivo.component.css"],
})
export class PopUpMateriasSinCerrar {
  constructor(
    public dialogRef: MatDialogRef<PopUpCerrarEtapa>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onOkClick(): void {
    this.dialogRef.close();
  }
}
