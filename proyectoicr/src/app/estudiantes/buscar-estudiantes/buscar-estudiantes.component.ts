import { AdultoResponsableService } from "./../../adulto-responsable/adultoResponsable.service";
import { Component, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { EstudiantesService } from "../estudiante.service";
import { Estudiante } from "../estudiante.model";
import { MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";
import { browserRefresh } from "src/app/app.component";

@Component({
  selector: "app-buscar-estudiantes",
  templateUrl: "./buscar-estudiantes.component.html",
  styleUrls: ["./buscar-estudiantes.component.css"],
})
export class BuscarEstudiantesComponent implements OnInit {
  estudiantes: Estudiante[] = [];
  buscarPorNomYAp = true;
  apellidoEstSelec: string;
  nombreEstSelec: string;
  nroDocEstSelec: number;
  tipoDocEstSelec: string;

  constructor(
    public servicio: EstudiantesService,
    public dialog: MatDialog,
    public servicioAR: AdultoResponsableService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    //Para que al recargar la pagina se actualice correctamente
    if (browserRefresh) {
      this.router.navigate(["/buscar"]);
      this.servicio.estudianteSeleccionado = null;
      this.servicio.retornoDesdeAcciones = false;
    }
    if (!this.servicio.retornoDesdeAcciones) {
      this.nombreEstSelec = "";
      this.apellidoEstSelec = "";
    } else if (this.servicio.busquedaEstudianteXNombre) {
      this.servicio.buscarEstudiantesNombreApellido(
        this.servicio.estudianteSeleccionado.nombre,
        this.servicio.estudianteSeleccionado.apellido
      );
      this.nombreEstSelec = this.servicio.estudianteSeleccionado.nombre;
      this.apellidoEstSelec = this.servicio.estudianteSeleccionado.apellido;
    } else {
      this.servicio.buscarEstudiantesDocumento(
        this.servicio.estudianteSeleccionado.tipoDocumento,
        this.servicio.estudianteSeleccionado.numeroDocumento
      );
      this.nroDocEstSelec = this.servicio.estudianteSeleccionado.numeroDocumento;
      this.tipoDocEstSelec = this.servicio.estudianteSeleccionado.tipoDocumento;
      this.buscarPorNomYAp = false;
    }
  }

  // Si el formulario no es valido no hace nada, luego controla que tipo de busqueda es
  OnBuscar(form: NgForm) {
    if (form.valid) {
      if (this.buscarPorNomYAp) {
        this.servicio.busquedaEstudianteXNombre = true;
        this.servicio.buscarEstudiantesNombreApellido(
          form.value.nombre.trim(),
          form.value.apellido.trim()
        );
      } else {
        this.servicio.buscarEstudiantesDocumento(
          form.value.tipoDocumento,
          form.value.numeroDocumento
        );
        this.servicio.busquedaEstudianteXNombre = false;
      }
      this.router.navigate(["/buscar/lista"]);
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

  // Cuando el usuario cambia de opcion de busqueda, deshabilita los inputs segun corresponda
  DeshabilitarInputs(form: NgForm) {
    this.buscarPorNomYAp = !this.buscarPorNomYAp;
    form.resetForm();
  }

  onCancelar() {
    this.dialog.open(BuscarPopupComponent, {
      width: "250px",
    });
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

@Component({
  selector: "app-buscar-popup",
  templateUrl: "./buscar-popup.component.html",
  styleUrls: ["./buscar-estudiantes.component.css"],
})
export class BuscarPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<BuscarPopupComponent>,
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
