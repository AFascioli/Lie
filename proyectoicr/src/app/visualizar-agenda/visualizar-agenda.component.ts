import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-visualizar-agenda",
  templateUrl: "./visualizar-agenda.component.html",
  styleUrls: ["./visualizar-agenda.component.css"]
})
export class VisualizarAgendaComponent implements OnInit {
  dias = ["Hora", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]; //Agrego Hora en los dos vectores para que el calculo sea siempre +1 +2
  modulo = [
    "Hora",
    "07:00",
    "07:45",
    "08:30",
    "09:15",
    "10:00",
    "10:45",
    "11:30",
    "12:15",
    "13:00",
    "13:45"
  ];
  materiaObj = {
    nombre: "Matemáticas",
    dia: "Miercoles",
    inicio: "09:15",
    fin: "11:30"
  };

  materiaObj2 = {
    nombre: "Matemáticas",
    dia: "Miercoles",
    inicio: "11:30",
    fin: "12:15"
  };

  constructor() {}

  ngOnInit() {
    this.acomodarEnGrilla("1", this.materiaObj);
    this.acomodarEnGrilla("2", this.materiaObj2);
  }

  //Dada la id de un elemento HTML, le pone el respectivo css para acomodarlo en la grilla
  acomodarEnGrilla(id: string, materiaObj: any) {
    let elem: HTMLElement = document.getElementById(id);
    elem.setAttribute(
      "style",
      `grid-column-start: ${this.dias.indexOf(materiaObj.dia) +
        1}; grid-column-end: ${this.dias.indexOf(materiaObj.dia) +
        2}; grid-row-start: ${this.modulo.indexOf(
        materiaObj.inicio) + 1}; grid-row-end: ${this.modulo.indexOf(
        materiaObj.fin) + 1};`
    );
  }
}
