import { Component, OnInit, Inject } from "@angular/core";
import { EstudiantesService } from '../estudiante.service';
import { Estudiante } from '../estudiante.model';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: "app-lista-estudiantes",
  templateUrl: "./lista-estudiantes.component.html",
  styleUrls: ["./lista-estudiantes.component.css"]
})
export class ListaEstudiantesComponent implements OnInit {
  dniSeleccionado: number;
  estudiantes: Estudiante[] = [];

  constructor(public servicio: EstudiantesService, public dialog: MatDialog, public router: Router) {}

  ngOnInit() {
    this.servicio.getEstudiantesListener().subscribe(estudiantesBuscados =>{
      this.estudiantes = estudiantesBuscados;
    })
  }

  displayedColumns: string[] = ["apellido", "nombre", "tipo", "numero", "accion"];

  //OnSelection(row) {
    //this.dniSeleccionado = row.dni;
    //console.log(this.dniSeleccionado);
  //}

  OnSelection(row): void {
    console.log('entro modificar')
    this.servicio.estudianteSeleccionado = this.estudiantes.find(estudiante => estudiante.numeroDocumento===row.dni);
    this.router.navigate(['menuLateral/mostrar']);
  }

}



