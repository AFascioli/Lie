import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstudiantesService } from '../estudiante.service';
import { NgForm } from '@angular/forms';
import { Provincia } from '../provincias.model';
import { Localidad } from '../localidades.model';
import { Subscription } from 'rxjs';
import {DateAdapter} from '@angular/material';
import { Nacionalidad } from '../nacionalidades.model';


@Component({
  selector: 'app-alta-estudiantes',
  templateUrl: './alta-estudiantes.component.html',
  styleUrls: ['./alta-estudiantes.component.css']
})
export class AltaEstudiantesComponent implements OnInit, OnDestroy {

  maxDate = new Date();
  nacionalidades: Nacionalidad[] = [];
  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  localidadesFiltradas: Localidad[] = [];
  localidadesFiltradasNac: Localidad[] = [];
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
    this.servicio.getLocalidades();
    this.suscripcion = this.servicio.getLocalidadesListener().subscribe(localidadesActualizadas => {
      this.localidades = localidadesActualizadas;
    });
    this.servicio.getNacionalidades();
    this.suscripcion = this.servicio.getNacionalidadesListener().subscribe(nacionalidadesActualizadas => {
      this.nacionalidades = nacionalidadesActualizadas;
    });
  }

  // Cuando se destruye el componente se eliminan las suscripciones.
  ngOnDestroy() {
    this.suscripcion.unsubscribe();
  }

 onGuardar(form: NgForm) {
   if(form.invalid){

   }else{
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

 FiltrarLocalidades(idProvincia: number){
  this.localidadesFiltradas= [...this.localidades];
  this.localidadesFiltradas= this.localidadesFiltradas.filter(localidad => localidad.id_provincia===idProvincia);
 }

 FiltrarLocalidadesNac(idProvincia: number){
  this.localidadesFiltradasNac= [...this.localidades];
  this.localidadesFiltradasNac= this.localidadesFiltradasNac.filter(localidad => localidad.id_provincia===idProvincia);
 }
}
