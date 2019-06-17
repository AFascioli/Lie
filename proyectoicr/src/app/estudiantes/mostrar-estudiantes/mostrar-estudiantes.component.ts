import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from '../estudiante.service';
import { Subscription } from 'rxjs';
import { Provincia } from '../provincias.model';
import { FormGroup } from '@angular/forms';
import { Estudiante } from '../estudiante.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mostrar-estudiantes',
  templateUrl: './mostrar-estudiantes.component.html',
  styleUrls: ['./mostrar-estudiantes.component.css']
})

export class MostrarEstudiantesComponent implements OnInit {

  provincias: Provincia[] = [];
  suscripcion: Subscription;
  estudiante: Estudiante;
  formulario: FormGroup;
  apellidoEstudiante:String="Vilardo";

  constructor(public servicio: EstudiantesService) {

  }

  // Cuando se inicializa el componente se cargar las provincias.
  ngOnInit() {
  //  this.formulario.disable();
    this.servicio.getProvincias();
    this.suscripcion = this.servicio.getProvinciasListener().subscribe(provinciasActualizadas => {
      this.provincias = provinciasActualizadas;
    });
  }

  cargarEstudiante(){

  }
  // Cuando se destruye el componente se eliminan las suscripciones.
  ngOnDestroy() {
    this.suscripcion.unsubscribe();
  }
}
