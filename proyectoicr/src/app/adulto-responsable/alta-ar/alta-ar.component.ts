import { EstudiantesService } from "src/app/estudiantes/estudiante.service";

import { AdultoResponsableService } from "./../adultoResponsable.service";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { DateAdapter, MatSnackBar } from "@angular/material";
import { Subscription } from "rxjs";
import { NgForm } from "@angular/forms";
import { Nacionalidad } from "src/app/estudiantes/nacionalidades.model";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
  selector: "app-alta-ar",
  templateUrl: "./alta-ar.component.html",
  styleUrls: ["./alta-ar.component.css"]
})
export class AltaARComponent implements OnInit, OnDestroy {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;
  maxDate = new Date();
  nacionalidades: Nacionalidad[] = [];
  suscripcion: Subscription;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  tutor: boolean= false;

  constructor(
    public servicio: AdultoResponsableService,
    public servicioEstudiante: EstudiantesService,
    private dateAdapter: DateAdapter<Date>,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicioEstudiante.estudianteSeleccionado._id;
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
    if (!form.invalid) {
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
        this.tutor,
        this._idEstudiante
      ).subscribe(response=>{
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
    this.dialog.open(AltaARPopupComponent, {
      width: "250px"
    });
  }

  checkLetras(event) {
    var inputValue = event.which;
    if (
      !(
        (inputValue >= 65 && inputValue <= 122) ||
        (inputValue == 209 || inputValue == 241)
      ) &&
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
    this.router.navigate(["./buscar/lista"]);
    this.dialogRef.close();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
