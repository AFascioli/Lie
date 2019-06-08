import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstudiantesService } from '../estudiante.service';
import { NgForm } from '@angular/forms';
import { Provincia } from '../provincias.model';
import { Subscription } from 'rxjs';
import {DateAdapter} from '@angular/material';


@Component({
  selector: 'app-alta-estudiantes',
  templateUrl: './alta-estudiantes.component.html',
  styleUrls: ['./alta-estudiantes.component.css']
})
export class AltaEstudiantesComponent implements OnInit, OnDestroy {
  maxDate = new Date();

  provincias: Provincia[] = [];
  suscripcion: Subscription;

  constructor(public servicio: EstudiantesService, private dateAdapter: DateAdapter<Date>) {
    this.dateAdapter.setLocale('es');
   }

  // Cuando se inicializa el componente se cargar las provincias.
  ngOnInit() {
    this.servicio.getProvincias();
    this.suscripcion = this.servicio.getProvinciasListener().subscribe(provinciasActualizadas => {
      this.provincias = provinciasActualizadas;
    });
  }

  // Cuando se destruye el componente se eliminan las suscripciones.
  ngOnDestroy() {
    this.suscripcion.unsubscribe();
  }

 onGuardar(form: NgForm) {
  this.servicio.altaEstudiante(
    form.value.apellido,
    form.value.nombre,
    form.value.tipoDoc,
    form.value.nroDoc,
    form.value.cuil,
    form.value.sexo,
    form.value.calle,
    form.value.nroCalle,
    form.value.piso,
    form.value.departamento,
    form.value.provincia,
    form.value.localidad,
    form.value.codigoPostal,
    form.value.nacionalidad,
    form.value.localidadNac,
    form.value.provinciaNac,
    form.value.fechaNac,
    form.value.estadoCivil,
    form.value.telefono,
    null
  );
  form.resetForm();
 }
}
