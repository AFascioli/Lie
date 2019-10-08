import { Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { Nacionalidad } from 'src/app/estudiantes/nacionalidades.model';
import { EmpleadoService } from '../empleado.service';
import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';
import { DateAdapter,MatSnackBar} from '@angular/material';
import { NgForm } from '@angular/forms';
import { MediaMatcher } from '@angular/cdk/layout';

@Component({
  selector: 'app-alta-empleado',
  templateUrl: './alta-empleado.component.html',
  styleUrls: ['./alta-empleado.component.css']
})
export class AltaEmpleadoComponent implements OnInit, OnDestroy {
  maxDate = new Date();
  nacionalidades: Nacionalidad[] = [];
  suscripcion: Subscription;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(
    public servicio: EmpleadoService,
    public servicioEstudiante: EstudiantesService,
    private dateAdapter: DateAdapter<Date>,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
  this.mobileQuery = media.matchMedia('(max-width: 1000px)');
  this._mobileQueryListener = () => changeDetectorRef.detectChanges();
  this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.servicioEstudiante.getNacionalidades();
    this.suscripcion = this.servicioEstudiante
   .getNacionalidadesListener()
  .subscribe(nacionalidadesActualizadas => {
    this.nacionalidades = nacionalidadesActualizadas;
    });
  }

  // Cuando se destruye el componente se eliminan las suscripciones.
  ngOnDestroy() {
    this.suscripcion.unsubscribe();
  }

  onGuardar(form: NgForm) {
    if(!form.invalid) {
      console.log(form.value.email);
      this.servicio.registrarEmpleado(
        form.value.apellido,
        form.value.nombre,
        form.value.tipoDocumento,
        form.value.nroDocumento,
        form.value.sexo,
        form.value.nacionalidad,
        form.value.fechaNac,
        form.value.telefono,
        form.value.email,
        form.value.tipoEmpleado
        ).subscribe(response=>{
          console.log(response);
        if(response.exito){
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4000
          });
          form.resetForm();
        }else{
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-fracaso"],
            duration: 4000
          });
        }
      });
    }else{
      this.snackBar.open("Faltan campos por completar", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4000
      });
    }
  }

  popUpCancelar() {
    this.dialog.open(AltaEmpleadoPopupComponent, {
      width: "250px"
    });
  }

  checkLetras(event) {
    var inputValue = event.which;
    if (
      !(inputValue >= 65 && inputValue <= 122 || (inputValue == 209 ||  inputValue == 241)) &&
      (inputValue != 32 && inputValue != 0)
    ) {
      event.preventDefault();
    }
  }

   //Chequea que solo se puedan tipear numeros
   checkNumeros(event) {
    var inputValue = event.which;
    if (
      !(inputValue >= 48 && inputValue <= 57) &&
      (inputValue != 32 && inputValue != 0)
    ) {
      event.preventDefault();
    }
  }

}

@Component({
  selector: "app-alta-empleado-popup",
  templateUrl: "./alta-empleado-popup.component.html",
  styleUrls: ["./alta-empleado.component.css"]
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
