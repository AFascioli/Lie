import { Nacionalidad } from "./../nacionalidades.model";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { EstudiantesService } from "../estudiante.service";
import { NgForm } from "@angular/forms";
import { Provincia } from "../provincias.model";
import { Localidad } from "../localidades.model";
import { Subscription } from "rxjs";
import { DateAdapter, MatSnackBar } from "@angular/material";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { MediaMatcher } from '@angular/cdk/layout';

@Component({
  selector: "app-alta-estudiantes",
  templateUrl: "./alta-estudiantes.component.html",
  styleUrls: ["./alta-estudiantes.component.css"]
})
export class AltaEstudiantesComponent implements OnInit, OnDestroy {
  maxDate = new Date();
  nacionalidades: Nacionalidad[] = [];
  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  localidadesFiltradas: Localidad[] = [];
  suscripcion: Subscription;
  nombreProvinciaSeleccionada: string;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(
    public servicio: EstudiantesService,
    private dateAdapter: DateAdapter<Date>,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,

    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
//    this.dateAdapter.setLocale("es");
  this.mobileQuery = media.matchMedia('(max-width: 1000px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  // Cuando se inicializa el componente se cargar las provincias.
  ngOnInit() {
    this.servicio.formInvalidoEstudiante = true;
    this.servicio.getProvincias();
    this.suscripcion = this.servicio
      .getProvinciasListener()
      .subscribe(provinciasActualizadas => {
        this.provincias = provinciasActualizadas;
      });
    this.servicio.getLocalidades();
    this.suscripcion = this.servicio
      .getLocalidadesListener()
      .subscribe(localidadesActualizadas => {
        this.localidades = localidadesActualizadas;
      });
    this.servicio.getNacionalidades();
    this.suscripcion = this.servicio
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
      this.servicio.altaEstudiante(
        form.value.apellido,
        form.value.nombre,
        form.value.tipoDocumento,
        form.value.nroDocumento,
        form.value.cuil,
        form.value.sexo,
        form.value.calle,
        form.value.nroCalle,
        form.value.piso,
        form.value.departamento,
        form.value.provincia,
        form.value.localidad,
        form.value.codigoPostal,
        form.value.nacionalidad,
        form.value.fechaNac,
        form.value.estadoCivil,
        form.value.telefono,
        "AdultoTest"
      );
      form.resetForm();
    }
  }

  FiltrarLocalidades() {
    const idProvinciaSeleccionada = this.provincias.find(
      provincia => provincia.nombre === this.nombreProvinciaSeleccionada
    ).id;
    this.localidadesFiltradas = [...this.localidades];
    this.localidadesFiltradas = this.localidadesFiltradas.filter(
      localidad => localidad.id_provincia == idProvinciaSeleccionada
    );
  }

  snackBarGuardar(form: NgForm): void {
    if (form.invalid) {
      this.snackBar.open("Faltan campos por completar", "", {
        panelClass: ['snack-bar-fracaso'],
        duration: 4000
      });
    } else {
      this.snackBar.open("El estudiante se ha registrado correctamente", "", {
        panelClass: ['snack-bar-exito'],
        duration: 4000
      });
    }
  }


  popUpCancelar() {
    this.dialog.open(AltaPopupComponent, {
      width: "250px"
    });
  }

  //Chequea que solo se puedan tipear letras y espacio
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
  selector: "app-alta-popup",
  templateUrl: "./alta-popup.component.html",
  styleUrls: ["./alta-estudiantes.component.css"]
})
export class AltaPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<AltaPopupComponent>,
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
