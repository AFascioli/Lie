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

  constructor(public servicio: EstudiantesService) { }

  ngOnInit() {

  }

  OnBuscar(form: NgForm){
    console.log("buscar-estudiantes.component.ts-->OnBuscar() "+ form.value.tipoDocumento+ " " + form.value.numeroDocumento);
    this.servicio.buscarEstudiantesDocumento(form.value.tipoDocumento, form.value.numeroDocumento);
  }
}
