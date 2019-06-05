import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from '../estudiante.service';
import { Estudiante } from '../estudiante.model';

@Component({
  selector: "app-lista-estudiantes",
  templateUrl: "./lista-estudiantes.component.html",
  styleUrls: ["./lista-estudiantes.component.css"]
})
export class ListaEstudiantesComponent implements OnInit {
  dniSeleccionado: number;
  estudiantes: Estudiante[] = [];

  constructor(public servicio: EstudiantesService) {}

  ngOnInit() {
    this.servicio.getEstudiantesListener().subscribe(estudiantesBuscados =>{
      this.estudiantes = estudiantesBuscados;
    })
  }

  displayedColumns: string[] = ["apellido", "nombre", "dni", "accion"];
  dataSource = this.estudiantes;

  OnSelection(row) {
    this.dniSeleccionado = row.dni;
    console.log(this.dniSeleccionado);
  }
}
