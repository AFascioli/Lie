import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { EstudiantesService } from '../estudiante.service';
import { Estudiante } from '../estudiante.model';


@Component({
  selector: 'app-buscar-estudiantes',
  templateUrl: './buscar-estudiantes.component.html',
  styleUrls: ['./buscar-estudiantes.component.css']
})
export class BuscarEstudiantesComponent implements OnInit {

  estudiantes: Estudiante[] = [];
  buscarPorNomYAp= true;

  constructor(public servicio: EstudiantesService) { }

  ngOnInit() {

  }

  // Si el formulario no es valido no hace nada, luego controla que tipo de busqueda es
  OnBuscar(form: NgForm){
    if(!form.invalid){
      if(this.buscarPorNomYAp){
        this.servicio.buscarEstudiantesNombreApellido(form.value.nombre, form.value.apellido);
      }else{
        this.servicio.buscarEstudiantesDocumento(form.value.tipoDocumento, form.value.numeroDocumento);
      }
    }

  }

  // Cuando el usuario cambia de opcion de busqueda, deshabilita los inputs segun corresponda
  DeshabilitarInputs(form: NgForm){
    this.buscarPorNomYAp= !this.buscarPorNomYAp;
    form.resetForm();
  }
}
