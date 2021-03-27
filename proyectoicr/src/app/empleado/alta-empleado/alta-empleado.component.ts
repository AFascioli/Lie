import { UbicacionService } from "src/app/ubicacion/ubicacion.service";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Subscription, Subject } from "rxjs";
import { Nacionalidad } from "src/app/ubicacion/nacionalidades.model";
import { EmpleadoService } from "../empleado.service";
import { MatSnackBar } from "@angular/material";
import { NgForm } from "@angular/forms";
import { MediaMatcher } from "@angular/cdk/layout";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-alta-empleado",
  templateUrl: "./alta-empleado.component.html",
  styleUrls: ["./alta-empleado.component.css"],
})
export class AltaEmpleadoComponent implements OnInit, OnDestroy {
  maxDate = new Date();
  nacionalidades: Nacionalidad[] = [];
  suscripcion: Subscription;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  private unsubscribe: Subject<void> = new Subject();

  //para asignar valores por defecto
  nacionalidadEmpleado: string;

  constructor(
    public servicio: EmpleadoService,
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
    this.nacionalidadEmpleado = "Argentina";
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

  // Cuando se destruye el componente se eliminan las suscripciones.
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onGuardar(form: NgForm) {
    if (!form.invalid) {
      this.servicio
        .registrarEmpleado(
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
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          if (response.exito) {
            this.snackBar.open(response.message, "", {
              panelClass: ["snack-bar-exito"],
              duration: 4000,
            });
            form.resetForm();
            setTimeout(() => {
              this.nacionalidadEmpleado = "Argentina";
            }, 100);
          } else {
            this.snackBar.open(response.message, "", {
              panelClass: ["snack-bar-fracaso"],
              duration: 4000,
            });
          }
        });
    } else {
      this.snackBar.open("Faltan campos por completar", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4000,
      });
    }
  }

  popUpCancelar() {
    this.dialog.open(AltaEmpleadoPopupComponent, {
      width: "250px",
    });
  }

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

@Component({
  selector: "app-alta-empleado-popup",
  templateUrl: "./alta-empleado-popup.component.html",
  styleUrls: ["./alta-empleado.component.css"],
})
export class AltaEmpleadoPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<AltaEmpleadoPopupComponent>,
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
