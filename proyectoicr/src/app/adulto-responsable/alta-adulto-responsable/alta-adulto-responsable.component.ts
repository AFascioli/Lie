import { UbicacionService } from "src/app/ubicacion/ubicacion.service";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AdultoResponsableService } from "../adultoResponsable.service";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material";
import { Subscription, Subject } from "rxjs";
import { NgForm } from "@angular/forms";
import { Nacionalidad } from "src/app/ubicacion/nacionalidades.model";
import { MediaMatcher } from "@angular/cdk/layout";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-alta-adulto-responsable",
  templateUrl: "./alta-adulto-responsable.component.html",
  styleUrls: ["./alta-adulto-responsable.component.css"],
})
export class AltaAdultoResponsableComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject();
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;
  maxDate = new Date();
  nacionalidades: Nacionalidad[] = [];
  suscripcion: Subscription;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  tutor: boolean = false;
  nacionalidadAdultoResponsable: string = "Argentina";

  constructor(
    public servicio: AdultoResponsableService,
    public servicioEstudiante: EstudiantesService,
    public servicioUbicacion: UbicacionService,
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
    this.cargarEstudianteSeleccionado();
    this.obtenerNacionalidades();
  }

  cargarEstudianteSeleccionado() {
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicioEstudiante.estudianteSeleccionado._id;
  }

  obtenerNacionalidades() {
    this.servicioUbicacion.getNacionalidades();
    this.suscripcion = this.servicioUbicacion
      .getNacionalidadesListener()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((nacionalidadesActualizadas) => {
        this.nacionalidades = nacionalidadesActualizadas;
        this.nacionalidades.sort((a, b) =>
          a.name > b.name ? 1 : b.name > a.name ? -1 : 0
        );
      });
  }

  checkIfIsALetter(event) {
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
  
  checkLetrasNumerosEmail(event) {
    var inputValue = event.which;
    
    if (
      !(
        (inputValue >= 64 && inputValue <= 122) ||
        inputValue == 209 ||
        inputValue == 241 ||
        inputValue == 46
      ) &&
      inputValue != 32 &&
      inputValue != 0 &&
      !(inputValue >= 48 && inputValue <= 57) &&
      inputValue != 32 &&
      inputValue != 0
    ) {
      event.preventDefault();
    }
  }

  checkIfIsANumber(event) {
    var inputValue = event.which;
    if (
      !(inputValue >= 48 && inputValue <= 57) &&
      inputValue != 32 &&
      inputValue != 0
    ) {
      event.preventDefault();
    }
  }

  openPopUpVolver() {
    this.dialog.open(AltaAdultoResponsablePopupComponent, {
      width: "250px",
    });
  }

  registrarAdultoResponsable(form) {
    this.servicio
      .registrarAdultoResponsable(
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
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        if (response.exito) {
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4000,
          });
          form.resetForm();
          this.tutor = false;
        } else {
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-fracaso"],
            duration: 4000,
          });
        }
      });
  }

  onGuardar(form: NgForm) {
    if (!form.invalid) {
      this.registrarAdultoResponsable(form);
    } else {
      this.snackBar.open("Faltan campos por completar", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4000,
      });
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

@Component({
  selector: "app-alta-ar-popup",
  templateUrl: "./alta-adulto-responsable-popup.component.html",
  styleUrls: ["./alta-adulto-responsable.component.css"],
})
export class AltaAdultoResponsablePopupComponent {
  constructor(
    public dialogRef: MatDialogRef<AltaAdultoResponsablePopupComponent>,
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
