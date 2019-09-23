import { EstudiantesService } from "./../../estudiantes/estudiante.service";
import { Component, OnInit, Inject} from "@angular/core";
import { DateAdapter, MatSnackBar } from "@angular/material";
import { NgForm } from "@angular/forms";
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA, MatDialogConfig } from "@angular/material";
import { Router } from "@angular/router";

@Component({
  selector: "app-justificacion-inasistencia",
  templateUrl: "./justificacion-inasistencia.component.html",
  styleUrls: ["./justificacion-inasistencia.component.css"]
})
export class JustificacionInasistenciaComponent implements OnInit {
  fechaActual = new Date();
  fechaUnica = new Date();
  fechaInicio = new Date();
  fechaFin = new Date();
  esMultiple: boolean = false;

  constructor(
    private servicio: EstudiantesService,
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {}

  //Envia al servicio un fecha inicio y una fecha fin (esta de esta manera por la consulta del backend)
  justificarInasistencia() {
    var fechaInicio;
    var fechaFin;
    if (this.esMultiple) {
      fechaInicio = new Date(this.fechaInicio.setHours(0, 0, 0));
      fechaFin = new Date(this.fechaFin.setHours(23, 59, 59));
    } else {
      fechaInicio = new Date(this.fechaUnica.setHours(0, 0, 0));
      fechaFin = new Date(this.fechaUnica.setHours(23, 59, 59));
    }
    this.servicio
      .justificarInasistencia(fechaInicio.toString(), fechaFin.toString(),this.esMultiple)
      .subscribe(respuesta => {
        this.snackBar.open(respuesta.message, "", {
          duration: 4500
        });
      });
  }

  //Deshabilita los inputs y los pickers
  deshabilitarPickers(form: NgForm) {
    this.esMultiple = !this.esMultiple;
  }

  onCancelar(){
    this.dialog.open(JustificacionInasistenciaPopupComponent, {
        width: "250px"
      });
    }
}

@Component({
  selector: "app-justificacion-inasistencia-popup",
  templateUrl: "./justificacion-inasistencia-popup.component.html",
  styleUrls: ['./justificacion-inasistencia.component.css']
})
export class JustificacionInasistenciaPopupComponent {
  formInvalido : Boolean;
      tipoPopup :  string;
  constructor(
        public dialogRef: MatDialogRef<JustificacionInasistenciaPopupComponent>, public router: Router,
      ) {}

      onYesClick():void{
        this.router.navigate(['./home']);
        this.dialogRef.close();
      }
      onNoClick(): void {
        this.dialogRef.close();
      }


    }

