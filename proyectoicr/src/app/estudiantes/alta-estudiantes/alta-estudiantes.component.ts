import { UbicacionService } from "src/app/ubicacion/ubicacion.service";
import { Nacionalidad } from "../../ubicacion/nacionalidades.model";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { EstudiantesService } from "../estudiante.service";
import { NgForm } from "@angular/forms";
import { Provincia } from "../../ubicacion/provincias.model";
import { Localidad } from "../../ubicacion/localidades.model";
import { Subscription } from "rxjs";
import { MatSnackBar } from "@angular/material";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MediaMatcher } from "@angular/cdk/layout";
import { CancelPopupComponent } from "src/app/popup-genericos/cancel-popup.component";

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
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  //para asignar valores por defecto
  nombreProvinciaSeleccionada: string;
  nombreLocalidadSeleccionada: string;
  defaultEstadoCivil = "soltero";
  codigoPostalEstudiante: string;
  estadoCivilEstudiante: string;
  nacionalidadEstudiante: string;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioUbicacion: UbicacionService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    //    this.dateAdapter.setLocale("es");
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  // Cuando se inicializa el componente se cargar las provincias.
  ngOnInit() {
    this.codigoPostalEstudiante = "2421";
    this.nacionalidadEstudiante = "Argentina";
    this.servicioEstudiante.formInvalidoEstudiante = true;
    this.servicioUbicacion.getProvincias();
    this.suscripcion = this.servicioUbicacion
      .getProvinciasListener()
      .subscribe(provinciasActualizadas => {
        this.provincias = provinciasActualizadas;
      });
    this.servicioUbicacion.getLocalidades();
    this.suscripcion = this.servicioUbicacion
      .getLocalidadesListener()
      .subscribe(localidadesActualizadas => {
        this.localidades = localidadesActualizadas;
        this.nombreProvinciaSeleccionada = "Cordoba";
        this.FiltrarLocalidades();
        this.nombreLocalidadSeleccionada = "Morteros";
      });
    this.servicioUbicacion.getNacionalidades();
    this.suscripcion = this.servicioUbicacion
      .getNacionalidadesListener()
      .subscribe(nacionalidadesActualizadas => {
        this.nacionalidades = nacionalidadesActualizadas;
        this.nacionalidades.sort((a, b) =>
          a.name > b.name ? 1 : b.name > a.name ? -1 : 0
        );
      });
  }

  // Cuando se destruye el componente se eliminan las suscripciones.
  ngOnDestroy() {
    this.suscripcion.unsubscribe();
  }

  onGuardar(form: NgForm) {
    if (form.invalid) {
      this.snackBar.open("Faltan campos por completar", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4000
      });
    } else {
      this.servicioEstudiante
        .altaEstudiante(
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
          form.value.telefono
        )
        .subscribe(respuesta => {
          if (respuesta.exito) {
            this.snackBar.open(respuesta.message, "", {
              panelClass: ["snack-bar-exito"],
              duration: 4000
            });
            form.resetForm();
          } else {
            this.snackBar.open(respuesta.message, "", {
              panelClass: ["snack-bar-fracaso"],
              duration: 4000
            });
          }
        });
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

  // snackBarGuardar(form: NgForm): void {
  //   if (form.invalid) {
  //     this.snackBar.open("Faltan campos por completar", "", {
  //       panelClass: ['snack-bar-fracaso'],
  //       duration: 4000
  //     });
  //   } else {
  //     this.snackBar.open("El estudiante se ha registrado correctamente", "", {
  //       panelClass: ['snack-bar-exito'],
  //       duration: 4000
  //     });
  //   }
  // }

  popUpCancelar() {
    this.dialog.open(CancelPopupComponent, {
      width: "250px"
    });
  }

  //Chequea que solo se puedan tipear letras y espacio
  checkLetras(event) {
    var inputValue = event.which;
    if (
      !(
        (inputValue >= 65 && inputValue <= 122) ||
        inputValue == 209 ||
        inputValue == 241
      ) &&
      inputValue != 32 &&
      inputValue != 0
    ) {
      event.preventDefault();
    }
  }

  //Chequea que solo se puedan tipear numeros
  checkNumeros(event) {
    var inputValue = event.which;
    if (
      !(inputValue >= 48 && inputValue <= 57) &&
      inputValue != 32 &&
      inputValue != 0
    ) {
      event.preventDefault();
    }
  }
}
