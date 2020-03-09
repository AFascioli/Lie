import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";

@Component({
  selector: "app-registrar-sanciones",
  templateUrl: "./registrar-sanciones.component.html",
  styleUrls: ["./registrar-sanciones.component.css"]
})
export class RegistrarSancionesComponent implements OnInit {
  fechaActual: Date;
  apellidoEstudiante: String;
  nombreEstudiante: String;
  tiposSanciones = ['Llamado de atención','Apercibimiento','Amonestación','Suspensión' ];
  tipoSancionSelected: Boolean = false;

  constructor(public servicioEstudiante: EstudiantesService) {}

  ngOnInit() {
    this.fechaActual = new Date();
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
  }

  onTipoSancionChange() {
    this.tipoSancionSelected = true;
  }

  guardar(cantidad, tipoSancion) {
    console.log('cantidad'+cantidad);
    console.log('tipo sancion'+tipoSancion);
  }

}
