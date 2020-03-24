import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { SancionService } from "../sancion.service";
import { MatSnackBar } from "@angular/material";
import { format } from "url";
import { NgForm } from "@angular/forms";

@Component({
  selector: "app-registrar-sanciones",
  templateUrl: "./registrar-sanciones.component.html",
  styleUrls: ["./registrar-sanciones.component.css"]
})
export class RegistrarSancionesComponent implements OnInit {
  fechaActual: Date;
  apellidoEstudiante: String;
  nombreEstudiante: String;
  idEstudiante: String;
  tiposSanciones = [
    "Llamado de atención",
    "Apercibimiento",
    "Amonestación",
    "Suspensión"
  ];
  tipoSancionSelected: Boolean = false;
  suspensionSelected: Boolean = false;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioSancion: SancionService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.fechaActual = new Date();
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
    this.idEstudiante = this.servicioEstudiante.estudianteSeleccionado._id;
  }

  onTipoSancionChange(tipoSancion) {
    this.tipoSancionSelected = true;
    if (tipoSancion == 3) {
      this.suspensionSelected = true;
    } else {
      this.suspensionSelected = false;
    }
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

  guardar(cantidad, tipoSancion, form: NgForm) {
    if (tipoSancion == 3) {
      cantidad = 1;
    }
    this.servicioSancion
      .registrarSancion(this.fechaActual,cantidad, tipoSancion, this.idEstudiante)
      .subscribe(rtdo => {
        if (rtdo.exito) {
          this.snackBar.open(rtdo.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 8000
          });
          form.resetForm();
        }
      });
  }
}
