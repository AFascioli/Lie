import { Component, OnInit, Inject } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA, MatDialogConfig, MatSnackBar} from "@angular/material";
import { Router } from "@angular/router";
import { DateAdapter } from "@angular/material";

@Component({
  selector: "app-llegada-tarde",
  templateUrl: "./llegada-tarde.component.html",
  styleUrls: ["./llegada-tarde.component.css"]
})
export class LlegadaTardeComponent implements OnInit {
  fechaActual = new Date();
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;
  matConfig = new MatDialogConfig();

  constructor( private servicio: EstudiantesService, public dialog: MatDialog,
    private dateAdapter: DateAdapter<Date>
  ) {
    this.dateAdapter.setLocale("es");
  }

  ngOnInit() {
    this.fechaActual = new Date();
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicio.estudianteSeleccionado._id;
  }

  cambiarTipoRetiro(){}

  openPopup(tipoPopup: string){
    this.matConfig.data={
      IdEstudiante: this._idEstudiante,

      tipoPopup: tipoPopup
    }
    this.dialog.open(LlegadaTardePopupComponent,this.matConfig);
  }
}

@Component({
  selector: "app-llegadaTarde-popup",
  templateUrl: "./llegadaTarde-popup.component.html",
  styleUrls: ["./llegada-tarde.component.css"]
})

export class LlegadaTardePopupComponent {
  tipoPopup: string;
  IdEstudiante: string;
  exito: boolean = false;
  resultado: string;

  constructor(
    public dialogRef: MatDialogRef<LlegadaTardePopupComponent>,
    public router: Router,
    public servicio: EstudiantesService,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.tipoPopup = data.tipoPopup;
    this.IdEstudiante = data.IdEstudiante;
  }

  //Cierra el popup y vuelve a la interfaz de retiro
  onNoCancelarConfirmarClick(): void {
    this.dialogRef.close();
  }

  //Confirma el retiro anticipado para el estudiante
  onYesConfirmarClick(): void {

  }
}
