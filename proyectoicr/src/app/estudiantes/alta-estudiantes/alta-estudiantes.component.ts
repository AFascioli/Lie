import { Component, OnInit } from '@angular/core';
import { EstudiantesService } from '../estudiante.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-alta-estudiantes',
  templateUrl: './alta-estudiantes.component.html',
  styleUrls: ['./alta-estudiantes.component.css']
})
export class AltaEstudiantesComponent implements OnInit {

  provincias: string[];

  constructor(public servicio: EstudiantesService) { }

  ngOnInit() {
    this.provincias = this.servicio.obtenerProvincias();
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
