import { AdultoResponsable } from "../adultoResponsable.model";
import { AdultoResponsableService } from "../adultoResponsable.service";
import { Component, OnInit } from "@angular/core";
import { takeUntil } from "rxjs/operators";
import { NgForm } from "@angular/forms";
import { Subject } from "rxjs";
import { MatDialog, MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";
import { CancelPopupComponent } from "src/app/popup-genericos/cancel-popup.component";
import { SelectionModel } from "@angular/cdk/collections";

@Component({
  selector: "app-asociar-adulto-responsable",
  templateUrl: "./asociar-adulto-responsable.component.html",
  styleUrls: ["./asociar-adulto-responsable.component.css"],
})
export class AsociarAdultoResponsableComponent implements OnInit {
  buscarPorNomYAp = true;
  ARFiltrados: AdultoResponsable[] = [];
  ARAsociados: AdultoResponsable[] = [];
  private unsubscribe: Subject<void> = new Subject();
  seleccion = new SelectionModel(true, []);
  displayedColumns: string[] = [
    "seleccion",
    "apellido",
    "nombre",
    "tipoDocumento",
    "nroDocumento",
  ];

  constructor(
    public dialog: MatDialog,
    public servicio: AdultoResponsableService,
    private router: Router,
    private snackBar: MatSnackBar,
    public popup: MatDialog
  ) {}

  ngOnInit() {}

  // Si el formulario no es valido no hace nada, luego controla que tipo de busqueda es
  onBuscar(form: NgForm) {
    if (form.valid) {
      if (this.buscarPorNomYAp) {
        this.servicio
          .buscarAdultoResponsableXNombre(
            form.value.nombre.trim(),
            form.value.apellido.trim()
          )
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            this.ARFiltrados = response.adultosResponsables;
          });
      } else {
        this.servicio
          .buscarAdultoResponsableXDocumento(
            form.value.tipoDocumento,
            form.value.numeroDocumento
          )
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            this.ARFiltrados = response.adultosResponsables;
          });
      }
    } else {
      this.snackBar.open("Faltan campos por completar", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4000,
      });
    }
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

  deshabilitarInputs(form: NgForm) {
    this.buscarPorNomYAp = !this.buscarPorNomYAp;
    form.resetForm();
  }

  onCancelar() {
    this.popup.open(CancelPopupComponent);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

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
