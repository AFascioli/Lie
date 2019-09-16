import { Component, OnInit, Inject } from '@angular/core';
import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { DateAdapter } from "@angular/material";

@Component({
  selector: 'app-retiro-anticipado',
  templateUrl: './retiro-anticipado.component.html',
  styleUrls: ['./retiro-anticipado.component.css']
})
export class RetiroAnticipadoComponent implements OnInit {
  fechaActual = new Date();
  apellidoEstudiante: string;
  nombreEstudiante: string;
  diaActual: string;
  _idEstudiante: string;
  antes10am: Boolean = true;
  matConfig = new MatDialogConfig();

  constructor(public servicio: EstudiantesService, public dialog: MatDialog, private dateAdapter: DateAdapter<Date>) {
    this.dateAdapter.setLocale("es");
  }

  ngOnInit() {
    this.fechaActual = new Date();
    this.conversionDiaActual();
    this.apellidoEstudiante= this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante= this.servicio.estudianteSeleccionado.nombre;
    this._idEstudiante= this.servicio.estudianteSeleccionado._id;
    this.validarHora();
  }

  //Segun que hora sea, cambia el valor de antes10am y cambia que radio button esta seleccionado
  validarHora(){
    if(this.fechaActual.getHours()>=10){
      this.antes10am= false;
    }
  }

  conversionDiaActual() {
    this.diaActual = this.fechaActual.toString();
    let dia = this.diaActual.substring(0,3);
    if( dia === 'Mon'){
      this.diaActual="Lunes"
    }else if(dia === 'Tue'){
      this.diaActual="Martes"
    }else if(dia === 'Wed'){
      this.diaActual="Miércoles"
    }else if(dia === 'Thu'){
      this.diaActual="Jueves"
    }else{
      this.diaActual="Viernes"
    }
  }

  CambiarTipoRetiro(){
    this.antes10am= !this.antes10am;
  }

  openPopup(tipoPopup: string){
    this.matConfig.data={
      IdEstudiante: this._idEstudiante,
      antes10am: this.antes10am,
      tipoPopup: tipoPopup
    }
    this.dialog.open(RetiroPopupComponent,this.matConfig);
  }
}


@Component({
  selector: "app-retiro-popup",
  templateUrl: "./retiro-popup.component.html",
  styleUrls: ['./retiro-anticipado.component.css']
})
export class RetiroPopupComponent {
  tipoPopup: string;
  IdEstudiante: string;
  antes10am: Boolean;
  resultado: string;

  constructor(
    public dialogRef: MatDialogRef<RetiroPopupComponent>,
    public router: Router,
    public servicio: EstudiantesService,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.tipoPopup = data.tipoPopup;
    this.IdEstudiante= data.IdEstudiante;
    this.antes10am= data.antes10am;
  }

  //Vuelve al menu principal
  onYesCancelarClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  //Cierra el popup y vuelve a la interfaz de retiro
  onNoCancelarConfirmarClick(): void {
    this.dialogRef.close();
  }

  //Confirma el retiro anticipado para el estudiante
  onYesConfirmarClick(): void {
    this.servicio.registrarRetiroAnticipado(this.IdEstudiante, this.antes10am).subscribe(response =>{
      this.resultado = response.exito;
      this.dialogRef.close();
      console.log(response);
      if(this.resultado == "exito"){
        this.snackBar.open("Se registró correctamente el retiro anticipado para el estudiante seleccionado.", "", {
          duration: 4500,
        });
      }else if (this.resultado == "retirado"){
        this.snackBar.open("Retiro no registrado. Ya se ha registrado un retiro anticipado para el estudiante seleccionado.", "", {
          duration: 4500,
        });
      }
      else if (this.resultado == "ausente"){
        this.snackBar.open("Retiro no registrado. El estudiante esta ausente para el día de hoy.", "", {
          duration: 4500,
        });
      }
      else{
        this.snackBar.open("Retiro no registrado. El estudiante no tiene registrada la asistencia para el día de hoy.", "", {
          duration: 4500,
        });
      }
    });
  }
}
