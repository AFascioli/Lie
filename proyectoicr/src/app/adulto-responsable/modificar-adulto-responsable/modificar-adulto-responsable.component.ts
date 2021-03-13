import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { AdultoResponsableService } from "../adultoResponsable.service";
import { AdultoResponsable } from "../adultoResponsable.model";
import { MediaMatcher } from "@angular/cdk/layout";
import { UbicacionService } from "src/app/ubicacion/ubicacion.service";
import { NgForm } from "@angular/forms";
import { MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { EmpleadoService } from "src/app/empleado/empleado.service";

@Component({
  selector: "app-modificar-adulto-responsable",
  templateUrl: "./modificar-adulto-responsable.component.html",
  styleUrls: ["./modificar-adulto-responsable.component.css"],
})
export class ModificarAdultoResponsableComponent implements OnInit {
  persona: any;
  nacionalidades: any[];
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  maxDate = new Date();
  private unsubscribe: Subject<void> = new Subject();
  esEmpleado=false;

  constructor(
    public servicioAR: AdultoResponsableService,
    public servicioEmpleado: EmpleadoService,
    public media: MediaMatcher,
    public changeDetectorRef: ChangeDetectorRef,
    public servicioUbicacion: UbicacionService,
    public snackBar: MatSnackBar,
    public router: Router
  ) {
    if (!this.servicioAR.personaSeleccionada)
      this.router.navigate(["./home"]);
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit(): void {
    this.esEmpleado= !this.servicioAR.buscoAR;
    this.persona = this.servicioAR.personaSeleccionada;    
    this.obtenerNacionalidades();
  }

  obtenerNacionalidades() {
    this.servicioUbicacion.getNacionalidades();
    this.servicioUbicacion
      .getNacionalidadesListener()
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

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onGuardar(form: NgForm) {
    if (form.valid) {
      if(this.esEmpleado){
        this.servicioEmpleado
          .modificarEmpleado(this.persona)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe(
            (response) => {
              if (response.exito) {
                this.snackBar.open(response.message, "", {
                  panelClass: ["snack-bar-exito"],
                  duration: 4000,
                });
              } else {
                this.snackBar.open(response.message, "", {
                  panelClass: ["snack-bar-fracaso"],
                  duration: 4000,
                });
              }
            }
          );
      }else{
        this.servicioAR
          .modificarAdultoResponsable(this.persona)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe(
            (response) => {
              if (response.exito) {
                this.snackBar.open(response.message, "", {
                  panelClass: ["snack-bar-exito"],
                  duration: 4000,
                });
              } else {
                this.snackBar.open(response.message, "", {
                  panelClass: ["snack-bar-fracaso"],
                  duration: 4000,
                });
              }
            }
          );
      }
    } else {
      this.snackBar.open("Faltan campos por completar", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4000,
      });
    }
  }

  onVolver(form: NgForm){
    this.router.navigate(["./buscarAdultoResponsable"]);
    this.servicioAR.retornoDesdeAcciones=true;
  }
}
