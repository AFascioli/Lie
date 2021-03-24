import { UbicacionService } from "src/app/ubicacion/ubicacion.service";
import { AutenticacionService } from "./../../login/autenticacionService.service";
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  Inject,
} from "@angular/core";
import { EstudiantesService } from "../estudiante.service";
import { Subscription, Subject } from "rxjs";
import { Provincia } from "../../ubicacion/provincias.model";
import { NgForm } from "@angular/forms";
import { Estudiante } from "../estudiante.model";
import { Nacionalidad } from "../../ubicacion/nacionalidades.model";
import { Localidad } from "../../ubicacion/localidades.model";
import {
  MatDialog,
  MatDialogRef,
  MatSnackBar,
  MAT_DIALOG_DATA,
} from "@angular/material";
import { Router } from "@angular/router";
import { MediaMatcher } from "@angular/cdk/layout";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-mostrar-estudiantes",
  templateUrl: "./mostrar-estudiantes.component.html",
  styleUrls: ["./mostrar-estudiantes.component.css"],
})
export class MostrarEstudiantesComponent implements OnInit, OnDestroy {
  nacionalidades: Nacionalidad[] = [];
  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  localidadesFiltradas: Localidad[] = [];
  suscripcion: Subscription;
  estudiante: Estudiante;
  maxDate = new Date();
  primeraVez = true;
  modoEditar = false;
  isLoading=false;
  private unsubscribe: Subject<void> = new Subject();
  //Atributos Estudiantes del HTML
  apellidoEstudiante: string;
  nombreEstudiante: string;
  tipoDocEstudiante: string;
  nroDocEstudiante: number;
  cuilEstudiante: number;
  sexoEstudiante: string;
  calleEstudiante: string;
  nroCalleEstudiante: number;
  pisoEstudiante: string;
  departamentoEstudiante: string;
  provinciaEstudiante: string;
  localidadEstudiante: string;
  CPEstudiante: number;
  fechaNacEstudiante: string;
  nacionalidadEstudiante: string;
  estadoCivilEstudiante: string;
  telefonoEstudiante: number;
  permisos = {
    notas: 0,
    asistencia: 0,
    eventos: 0,
    sanciones: 0,
    agendaCursos: 0,
    inscribirEstudiante: 0,
    registrarEmpleado: 0,
    cuotas: 0,
  };
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioUbicacion: UbicacionService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public authService: AutenticacionService,
    public changeDetectorRef: ChangeDetectorRef,
    public router: Router,
    public media: MediaMatcher
  ) {
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
    this.tipoDocEstudiante = this.servicioEstudiante.estudianteSeleccionado.tipoDocumento;
    this.nroDocEstudiante = this.servicioEstudiante.estudianteSeleccionado.numeroDocumento;
    this.cuilEstudiante = this.servicioEstudiante.estudianteSeleccionado.cuil;
    this.sexoEstudiante = this.servicioEstudiante.estudianteSeleccionado.sexo;
    this.calleEstudiante = this.servicioEstudiante.estudianteSeleccionado.calle;
    this.nroCalleEstudiante = this.servicioEstudiante.estudianteSeleccionado.numeroCalle;
    this.pisoEstudiante = this.servicioEstudiante.estudianteSeleccionado.piso;
    this.departamentoEstudiante = this.servicioEstudiante.estudianteSeleccionado.departamento;
    this.provinciaEstudiante = this.servicioEstudiante.estudianteSeleccionado.provincia;
    this.localidadEstudiante = this.servicioEstudiante.estudianteSeleccionado.localidad;
    this.CPEstudiante = this.servicioEstudiante.estudianteSeleccionado.codigoPostal;
    this.fechaNacEstudiante = this.servicioEstudiante.estudianteSeleccionado.fechaNacimiento;
    this.nacionalidadEstudiante = this.servicioEstudiante.estudianteSeleccionado.nacionalidad;
    this.estadoCivilEstudiante = this.servicioEstudiante.estudianteSeleccionado.estadoCivil;
    this.telefonoEstudiante = this.servicioEstudiante.estudianteSeleccionado.telefonoFijo;
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit() {
    this.isLoading=true;
    this.servicioUbicacion.getProvincias();
    this.suscripcion = this.servicioUbicacion
      .getProvinciasListener()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((provinciasActualizadas) => {
        this.provincias = provinciasActualizadas;
      });
    this.servicioUbicacion.getLocalidades();
    this.suscripcion = this.servicioUbicacion
      .getLocalidadesListener()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((localidadesActualizadas) => {
        this.localidades = localidadesActualizadas;
        this.FiltrarLocalidades();
      });
    this.servicioUbicacion.getNacionalidades();
    this.suscripcion = this.servicioUbicacion
      .getNacionalidadesListener()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((nacionalidadesActualizadas) => {
        this.nacionalidades = nacionalidadesActualizadas;
        this.isLoading=false;
      });
    this.authService
      .obtenerPermisosDeRol()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.permisos = response.permisos;
      });
  }

  FiltrarLocalidades() {
    const idProvinciaSeleccionada = this.provincias.find(
      (provincia) => provincia.nombre === this.provinciaEstudiante
    ).id;
    this.localidadesFiltradas = [...this.localidades];
    this.localidadesFiltradas = this.localidadesFiltradas.filter(
      (localidad) => localidad.id_provincia == idProvinciaSeleccionada
    );
  }

  onEditar() {
    this.modoEditar = !this.modoEditar;
  }

  onGuardar(form: NgForm) {
    if (!form.invalid && form.dirty) {
      this.isLoading=true;
      this.servicioEstudiante
        .modificarEstudiante(
          this.servicioEstudiante.estudianteSeleccionado._id,
          this.apellidoEstudiante,
          this.nombreEstudiante,
          this.tipoDocEstudiante,
          this.nroDocEstudiante,
          this.cuilEstudiante,
          this.sexoEstudiante,
          this.calleEstudiante,
          this.nroCalleEstudiante,
          this.pisoEstudiante,
          this.departamentoEstudiante,
          this.provinciaEstudiante,
          this.localidadEstudiante,
          this.CPEstudiante,
          this.nacionalidadEstudiante,
          this.fechaNacEstudiante,
          this.estadoCivilEstudiante,
          this.telefonoEstudiante
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((resultado) => {
        this.isLoading=false;
          if (resultado.exito) {
            this.modoEditar = false;
            this.snackBar.open(resultado.message, "", {
              panelClass: ["snack-bar-exito"],
              duration: 4000,
            });
          } else {
            this.snackBar.open(resultado.message, "", {
              panelClass: ["snack-bar-fracaso"],
              duration: 4000,
            });
          }
        });
    } else {
      if (form.invalid) {
        this.snackBar.open("Faltan campos por completar", "", {
          panelClass: ["snack-bar-fracaso"],
          duration: 4000,
        });
      } else {
        this.snackBar.open("No se han realizado cambios en el formulario", "", {
          panelClass: ["snack-bar-aviso"],
          duration: 4000,
        });
      }
    }
  }

  onBorrarVolver(tipo: string, form: NgForm): void {
    if (tipo == "volver" && !this.modoEditar) {
      this.router.navigate(["./buscar/lista"]);
    } else {
      let formInvalida = false;
      let formModificada = false;
      if (form.invalid) {
        formInvalida = true;
      } else {
        formInvalida = false;
        formModificada = form.dirty;
      }

      let popup = this.dialog.open(MostrarPopupComponent, {
        width: "250px",
        data: {
          tipoPopUp: tipo,
          formInvalida: formInvalida,
          formModificada: formModificada,
        },
      });

      popup.afterClosed().subscribe((borrar) => {
        if (borrar) {
          this.isLoading=true;
          this.servicioEstudiante
            .borrarEstudiante(
              this.servicioEstudiante.estudianteSeleccionado._id
            )
            .subscribe((rta) => {
              this.isLoading=false;
              if (rta.exito) {
                this.snackBar.open(rta.message, "", {
                  panelClass: ["snack-bar-exito"],
                  duration: 4000,
                });
                this.router.navigate(["./buscar/lista"]);
              }
            });
        }
      });
    }
  }
}

@Component({
  selector: "app-mostrar-popup",
  templateUrl: "./mostrar-popup.component.html",
  styleUrls: ["./mostrar-estudiantes.component.css"],
})
export class MostrarPopupComponent {
  tipoPopup: string;
  formInvalido: Boolean;
  formModificada: boolean;

  constructor(
    public dialogRef: MatDialogRef<MostrarPopupComponent>,
    public router: Router,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.tipoPopup = data.tipoPopUp;
    this.formInvalido = data.formInvalida;
    this.formModificada = data.formModificada;
  }

  onYesClick(): void {
    this.router.navigate(["./buscar/lista"]);
    this.dialogRef.close(false);
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onOkClick(): void {
    this.dialogRef.close(false);
  }

  onYesDeleteClick() {
    this.dialogRef.close(true);
  }
}
