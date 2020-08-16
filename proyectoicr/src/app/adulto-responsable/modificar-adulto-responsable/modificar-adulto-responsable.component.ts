import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { AdultoResponsableService } from "../adultoResponsable.service";
import { AdultoResponsable } from "../adultoResponsable.model";
import { MediaMatcher } from "@angular/cdk/layout";
import { UbicacionService } from "src/app/ubicacion/ubicacion.service";
import { NgForm } from "@angular/forms";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-modificar-adulto-responsable",
  templateUrl: "./modificar-adulto-responsable.component.html",
  styleUrls: ["./modificar-adulto-responsable.component.css"],
})
export class ModificarAdultoResponsableComponent implements OnInit {
  adultoResponsable: AdultoResponsable;
  nacionalidades: any[];
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(
    public servicioAR: AdultoResponsableService,
    public media: MediaMatcher,
    public changeDetectorRef: ChangeDetectorRef,
    public servicioUbicacion: UbicacionService,
    public snackBar: MatSnackBar
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit(): void {
    this.servicioUbicacion.getNacionalidades();
    this.servicioUbicacion
      .getNacionalidadesListener()
      .subscribe((nacionalidadesActualizadas) => {
        this.nacionalidades = nacionalidadesActualizadas;
        this.nacionalidades.sort((a, b) =>
          a.name > b.name ? 1 : b.name > a.name ? -1 : 0
        );
      });

    this.adultoResponsable = this.servicioAR.adultoResponsableSeleccionado;
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

  onGuardar(form: NgForm) {
    this.servicioAR
      .modificarAdultoResponsable(this.adultoResponsable)
      .subscribe(
        (response) => {
          if (response.exito) {
            this.snackBar.open(response.message, "", {
              panelClass: ["snack-bar-exito"],
              duration: 4000,
            });
            form.resetForm();
          } else {
            this.snackBar.open(response.message, "", {
              panelClass: ["snack-bar-fracaso"],
              duration: 4000,
            });
          }
        },
        (error) => {
          console.log(
            "Se presentaron problemas al querer modificar el adulto responsable: ",
            error
          );
        }
      );
  }
}
