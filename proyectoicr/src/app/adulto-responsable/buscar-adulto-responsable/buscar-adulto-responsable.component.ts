import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AdultoResponsableService } from "../adultoResponsable.service";
import { Component, OnInit } from "@angular/core";
import { takeUntil } from "rxjs/operators";
import { NgForm } from "@angular/forms";
import { Subject } from "rxjs";
import { MatDialog, MatSnackBar } from "@angular/material";
import { browserRefresh } from "src/app/app.component";
import { Router } from "@angular/router";
import { EmpleadoService } from "src/app/empleado/empleado.service";

@Component({
  selector: "app-buscar-adulto-responsable",
  templateUrl: "./buscar-adulto-responsable.component.html",
  styleUrls: ["./buscar-adulto-responsable.component.css"],
})
export class BuscarAdultoResponsableComponent implements OnInit {
  buscarPorNomYAp = true;
  buscarAdulto: boolean = true;
  personasFiltradas: any[] = [];
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
  nombrePersona;
  apellidoPersona;
  nroDocPersona;
  tipoDocPersona;

  constructor(
    public dialog: MatDialog,
    public servicioAdultoResponsable: AdultoResponsableService,
    public servicioEmpleado: EmpleadoService,
    public estudiantesService: EstudiantesService,
    private router: Router,
    private snackBar: MatSnackBar,
    public popup: MatDialog
  ) {}

  ngOnInit() {
    if (browserRefresh) {
      this.router.navigate(["/buscarPersona"]);
      this.servicioAdultoResponsable.personaSeleccionada = null;
      this.servicioAdultoResponsable.retornoDesdeAcciones = false;
    }
    if (!this.servicioAdultoResponsable.retornoDesdeAcciones) {
      this.nombrePersona = "";
      this.apellidoPersona = "";
    } else if (this.servicioAdultoResponsable.busquedaPersonaXNombre) {
      this.buscarAdulto=this.servicioAdultoResponsable.buscoAR;
      if (this.buscarAdulto) {
        this.servicioAdultoResponsable
          .buscarAdultoResponsableXNombre(
            this.servicioAdultoResponsable.personaSeleccionada.nombre,
            this.servicioAdultoResponsable.personaSeleccionada.apellido
          )
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            this.personasFiltradas = response.adultosResponsables;
            this.setColumns();
            this.isLoading = false;
          });
      } else {
        this.servicioEmpleado
          .buscarEmpleadoXNombre(
            this.servicioAdultoResponsable.personaSeleccionada.nombre,
            this.servicioAdultoResponsable.personaSeleccionada.apellido
          )
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            this.personasFiltradas = response.empleados;
            this.setColumns();
            this.isLoading = false;
          });
      }
      this.nombrePersona = this.servicioAdultoResponsable.personaSeleccionada.nombre;
      this.apellidoPersona = this.servicioAdultoResponsable.personaSeleccionada.apellido;
    } else {
      this.buscarAdulto=this.servicioAdultoResponsable.buscoAR;
      if (this.buscarAdulto) {
        this.servicioAdultoResponsable
          .buscarAdultoResponsableXDocumento(
            this.servicioAdultoResponsable.personaSeleccionada.tipoDocumento,
            this.servicioAdultoResponsable.personaSeleccionada.numeroDocumento
          )
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            this.personasFiltradas = response.adultosResponsables;
            this.setColumns();
            this.isLoading = false;
          });
      } else {
        this.servicioEmpleado
          .buscarEmpleadoXDocumento(
            this.servicioAdultoResponsable.personaSeleccionada.tipoDocumento,
            this.servicioAdultoResponsable.personaSeleccionada.numeroDocumento
          )
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            this.personasFiltradas = response.empleados;
            this.setColumns();
            this.isLoading = false;
          });
      }
      this.nroDocPersona = this.servicioAdultoResponsable.personaSeleccionada.numeroDocumento;
      this.tipoDocPersona = this.servicioAdultoResponsable.personaSeleccionada.tipoDocumento;
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
    this.servicioAdultoResponsable.busquedaPersonaXNombre = true;
    this.servicioAdultoResponsable
      .buscarAdultoResponsableXNombre(
        form.value.nombre.trim(),
        form.value.apellido.trim()
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.personasFiltradas = response.adultosResponsables;
        this.setColumns();
        this.isLoading = false;
      });
  }

  buscarAdultoResponsableXDocumento(form) {
    this.servicioAdultoResponsable.busquedaPersonaXNombre = false;
    this.servicioAdultoResponsable
      .buscarAdultoResponsableXDocumento(
        form.value.tipoDocumento,
        form.value.numeroDocumento
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.personasFiltradas = response.adultosResponsables;
        this.setColumns();
        this.isLoading = false;
      });
  }

  buscarEmpleadoXNombre(form) {
    this.servicioAdultoResponsable.busquedaPersonaXNombre = true;
    this.servicioEmpleado
      .buscarEmpleadoXNombre(
        form.value.nombre.trim(),
        form.value.apellido.trim()
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.personasFiltradas = response.empleados;
        this.setColumns();
        this.isLoading = false;
      });
  }

  buscarEmpleadoXDocumento(form) {
    this.servicioAdultoResponsable.busquedaPersonaXNombre = false;
    this.servicioEmpleado
      .buscarEmpleadoXDocumento(
        form.value.tipoDocumento,
        form.value.numeroDocumento
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.personasFiltradas = response.empleados;
        this.setColumns();
        this.isLoading = false;
      });
  }

  onBuscar(form: NgForm) {
    if (form.valid) {
      this.isLoading = true;
      this.busqueda = true;
      if (!this.buscarAdulto) {
        this.servicioAdultoResponsable.buscoAR=false;
        if (this.buscarPorNomYAp) {
          this.buscarEmpleadoXNombre(form);
        } else {
          this.buscarEmpleadoXDocumento(form);
        }
      } else {
        this.servicioAdultoResponsable.buscoAR=true;
        if (this.buscarPorNomYAp) {
          this.buscarAdultoResponsableXNombre(form);
        } else {
          this.buscarAdultoResponsableXDocumento(form);
        }
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

  onEditarPersona(row) {
    this.servicioAdultoResponsable.personaSeleccionada = this.personasFiltradas[
      row
    ];
  }

  onDelete(row) {
    this.servicioAdultoResponsable
      .deletePersona(
        this.buscarAdulto ? "AdultoResponsable" : "Empleado",
        this.personasFiltradas[row]._id,
        this.personasFiltradas[row].idUsuario
      )
      .subscribe((response) => {
        if (response.exito) {
          this.personasFiltradas.splice(row, 1);
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
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onVolver() {
    this.servicioAdultoResponsable.busquedaPersonaXNombre = true;
    this.servicioAdultoResponsable.retornoDesdeAcciones = false;
    this.servicioAdultoResponsable.personaSeleccionada = null;
    this.router.navigate(["./home"]);
  }
}
