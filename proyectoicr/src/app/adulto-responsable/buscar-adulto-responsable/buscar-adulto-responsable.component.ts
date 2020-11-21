import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AdultoResponsableService } from "../adultoResponsable.service";
import { Component, OnInit } from "@angular/core";
import { takeUntil } from "rxjs/operators";
import { NgForm } from "@angular/forms";
import { Subject } from "rxjs";
import { MatDialog, MatSnackBar } from "@angular/material";
import { browserRefresh } from "src/app/app.component";
import { Router } from "@angular/router";

@Component({
  selector: "app-buscar-adulto-responsable",
  templateUrl: "./buscar-adulto-responsable.component.html",
  styleUrls: ["./buscar-adulto-responsable.component.css"],
})
export class BuscarAdultoResponsableComponent implements OnInit {
  buscarPorNomYAp = true;
  ARFiltrados: any[] = [];
  private unsubscribe: Subject<void> = new Subject();
  displayedColumns: string[];
  displayedColumnsAsociados: string[] = [
    "apellido",
    "nombre",
    "numerodocumento",
    "telefono",
  ];
  busqueda: boolean = false;
  isLoading: boolean = false;
  nombreAR;
  apellidoAR;
  nroDocAR;
  tipoDocAR;

  constructor(
    public dialog: MatDialog,
    public servicio: AdultoResponsableService,
    public estudiantesService: EstudiantesService,
    private router: Router,
    private snackBar: MatSnackBar,
    public popup: MatDialog
  ) {}

  ngOnInit() {
    if (browserRefresh) {
      this.router.navigate(["/buscarAdultoResponsable"]);
      this.servicio.adultoResponsableSeleccionado = null;
      this.servicio.retornoDesdeAcciones = false;
    }
    if (!this.servicio.retornoDesdeAcciones) {
      this.nombreAR = "";
      this.apellidoAR = "";
    } else if (this.servicio.busquedaARXNombre) {
      this.servicio
        .buscarAdultoResponsableXNombre(
          this.servicio.adultoResponsableSeleccionado.nombre,
          this.servicio.adultoResponsableSeleccionado.apellido
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          this.ARFiltrados = response.adultosResponsables;
          this.setColumns();
          this.isLoading = false;
        });
      this.nombreAR = this.servicio.adultoResponsableSeleccionado.nombre;
      this.apellidoAR = this.servicio.adultoResponsableSeleccionado.apellido;
    } else {
      this.servicio
        .buscarAdultoResponsableXDocumento(
          this.servicio.adultoResponsableSeleccionado.tipoDocumento,
          this.servicio.adultoResponsableSeleccionado.numeroDocumento
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          this.ARFiltrados = response.adultosResponsables;
          this.setColumns();
          this.isLoading = false;
        });
      this.nroDocAR = this.servicio.adultoResponsableSeleccionado.numeroDocumento;
      this.tipoDocAR = this.servicio.adultoResponsableSeleccionado.tipoDocumento;
      this.buscarPorNomYAp = false;
    }
  }

  setColumns() {
    this.displayedColumns = [
      "apellido",
      "nombre",
      "telefono",
      "tipoDocumento",
      "nroDocumento",
      "editar",
    ];
  }

  buscarAdultoResponsableXNombre(form) {
    this.servicio.busquedaARXNombre = true;
    this.servicio
      .buscarAdultoResponsableXNombre(
        form.value.nombre.trim(),
        form.value.apellido.trim()
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.ARFiltrados = response.adultosResponsables;
        this.setColumns();
        this.isLoading = false;
      });
  }

  buscarAdultoResponsableXDocumento(form) {
    this.servicio.busquedaARXNombre = false;
    this.servicio
      .buscarAdultoResponsableXDocumento(
        form.value.tipoDocumento,
        form.value.numeroDocumento
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.ARFiltrados = response.adultosResponsables;
        this.setColumns();
        this.isLoading = false;
      });
  }

  onBuscar(form: NgForm) {
    this.isLoading = true;
    if (form.valid) {
      this.busqueda = true;
      if (this.buscarPorNomYAp) {
        this.buscarAdultoResponsableXNombre(form);
      } else {
        this.buscarAdultoResponsableXDocumento(form);
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

  onEditarAdultoResponsable(row) {
    this.servicio.adultoResponsableSeleccionado = this.ARFiltrados[row];
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onVolver() {
    this.servicio.busquedaARXNombre = true;
    this.servicio.retornoDesdeAcciones = false;
    this.servicio.adultoResponsableSeleccionado = null;
    this.router.navigate(["./home"]);
  }
}
