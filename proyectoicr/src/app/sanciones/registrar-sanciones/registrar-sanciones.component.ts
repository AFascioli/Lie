import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { SancionService } from "../sancion.service";

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

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioSancion: SancionService
  ) {}

  ngOnInit() {
    this.fechaActual = new Date();
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
    this.idEstudiante = this.servicioEstudiante.estudianteSeleccionado._id;
  }

  onTipoSancionChange() {
    this.tipoSancionSelected = true;
  }

  guardar(cantidad, tipoSancion) {
    this.servicioSancion
      .registrarSancion(cantidad, tipoSancion, this.idEstudiante)
      .subscribe(rtdo => {});
  }
}
