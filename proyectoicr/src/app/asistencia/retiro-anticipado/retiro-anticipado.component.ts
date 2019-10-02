import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { MediaMatcher } from '@angular/cdk/layout';

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
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(public servicio: EstudiantesService, public dialog: MatDialog,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher) {
      this.mobileQuery = media.matchMedia('(max-width: 1000px)');
        this._mobileQueryListener = () => changeDetectorRef.detectChanges();
        this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.fechaActual = new Date();
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
          panelClass:['snack-bar-exito'],
          duration: 4500,
          panelClass: ['snack-bar-exito']
        });
      }else if (this.resultado == "retirado"){
        this.snackBar.open("Retiro no registrado. Ya se ha registrado un retiro anticipado para el estudiante seleccionado.", "", {
          panelClass:['snack-bar-fracaso'],
          duration: 4500,
          panelClass: ['snack-bar-fracaso']
        });
      }
      else if (this.resultado == "ausente"){
        this.snackBar.open("Retiro no registrado. El estudiante esta ausente para el día de hoy.", "", {
          panelClass:['snack-bar-fracaso'],
          duration: 4500,
          panelClass: ['snack-bar-fracaso'],
        });
      }
      else{
        this.snackBar.open("Retiro no registrado. El estudiante no tiene registrada la asistencia para el día de hoy.", "", {
          panelClass:['snack-bar-fracaso'],
          duration: 4500,
          panelClass: ['snack-bar-fracaso'],
        });
      }
    });
  }
}
