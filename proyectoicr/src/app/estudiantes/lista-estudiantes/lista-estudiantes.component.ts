import { Component, OnInit } from "@angular/core";

const estudiantes: any[] = [
  { apellido: "Ponce", nombre: "Diego", dni: 39065840 },
  { apellido: "Bargiano", nombre: "Florencia", dni: 3545840 },
  { apellido: "Fascioli", nombre: "Agustin", dni: 39065842 },
  { apellido: "a1", nombre: "n1", dni: 97023120 },
  { apellido: "a2", nombre: "n2", dni: 34065840 },
  { apellido: "a3", nombre: "n3", dni: 439065840 },
  { apellido: "a4", nombre: "n4", dni: 12065840 },
  { apellido: "a5", nombre: "n5", dni: 312065840 }
];

@Component({
  selector: "app-lista-estudiantes",
  templateUrl: "./lista-estudiantes.component.html",
  styleUrls: ["./lista-estudiantes.component.css"]
})
export class ListaEstudiantesComponent implements OnInit {
  dniSeleccionado: number;
  constructor() {}

  ngOnInit() {}

  displayedColumns: string[] = ["apellido", "nombre", "dni", "accion"];
  dataSource = estudiantes;

  OnSelection(row) {
    this.dniSeleccionado = row.dni;
    console.log(this.dniSeleccionado);
  }
}
