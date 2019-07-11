import { Component, OnInit, Inject } from "@angular/core";
import { EstudiantesService } from '../estudiante.service';
import { Estudiante } from '../estudiante.model';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: "app-lista-estudiantes",
  templateUrl: "./lista-estudiantes.component.html",
  styleUrls: ["./lista-estudiantes.component.css"]
})
export class ListaEstudiantesComponent implements OnInit {
  dniSeleccionado: number;
  estudiantes: Estudiante[] = [];
  displayedColumns: string[] = ["apellido", "nombre", "tipo", "numero", "accion"];

  constructor(public servicio: EstudiantesService, public dialog: MatDialog, public router: Router) {}

  ngOnInit() {
    this.servicio.getEstudiantesListener().subscribe(estudiantesBuscados =>{
      this.estudiantes = estudiantesBuscados;
    })
  }

  OnSelection(row): void {
   this.servicio.estudianteSeleccionado = (this.estudiantes.find(estudiante => estudiante.numeroDocumento===row.numeroDocumento));
    this.router.navigate(['menuLateral/mostrar']);
  }

}



