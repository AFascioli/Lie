import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';

import { AdultoResponsableService } from './../adultoResponsable.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { DateAdapter, MatSnackBar } from "@angular/material";
import { Subscription } from "rxjs";
import { NgForm } from "@angular/forms";
import { Nacionalidad } from 'src/app/estudiantes/nacionalidades.model';


@Component({
  selector: 'app-alta-ar',
  templateUrl: './alta-ar.component.html',
  styleUrls: ['./alta-ar.component.css']
})
export class AltaARComponent implements OnInit, OnDestroy{
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;
  maxDate = new Date();
  nacionalidades: Nacionalidad[] = [];
  suscripcion: Subscription;
  constructor(
    public servicio: AdultoResponsableService,
    public servicioEstudiante: EstudiantesService,
    private dateAdapter: DateAdapter<Date>,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.apellidoEstudiante= this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante= this.servicioEstudiante.estudianteSeleccionado.nombre;
    this._idEstudiante= this.servicioEstudiante.estudianteSeleccionado._id;
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
    if (form.invalid) {
    } else {
      this.servicio.registrarAdultoResponsable(
        form.value.apellido,
        form.value.nombre,
        form.value.tipoDocumento,
        form.value.nroDocumento,
        form.value.sexo,
        form.value.nacionalidad,
        form.value.fechaNac,
        form.value.telefono,
        form.value.email,
        form.value.tutor,
        form.value.idEstudiante,
      );
      form.resetForm();
    }
  }

snackBarGuardar(form: NgForm): void {
    if (form.invalid) {
      this.snackBar.open("Faltan campos por completar", "", {
        panelClass: ['snack-bar-fracaso'],
        duration: 4000
      });
    } else {
      this.snackBar.open("El adulto responsable se ha registrado correctamente", "", {
        panelClass: ['snack-bar-exito'],
        duration: 4000
      });
    }
  }

  popUpCancelar() {
    this.dialog.open(AltaARPopupComponent, {
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
  selector: "app-alta-ar-popup",
  templateUrl: "./alta-ar-popup.component.html",
  styleUrls: ["./alta-ar.component.css"]
})
export class AltaARPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<AltaARPopupComponent>,
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
