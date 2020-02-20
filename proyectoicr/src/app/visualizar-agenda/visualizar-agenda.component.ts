import { AgendaService } from "./agenda.service";
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
    "08:40",
    "09:25",
    "10:10",
    "10:30",
    "10:15",
    "12:00",
    "12:20",
    "13:05",
    "13:55",
    "14:05",
    "14:50"
  ];
  colores = [];
  materias = [];
  constructor(public servicioAgenda: AgendaService) {}

  ngOnInit() {
    this.materias = this.servicioAgenda.obtenerMaterias();
  }

  //Este metodo dado por angular se ejecuta una vez que se cargo todo el html :D
  ngAfterViewInit() {
    this.materias.forEach((materia, index) => {
      this.acomodarEnGrilla(index.toString(), materia);
    });
  }

  //Ver si se puede hacer que cada div de materia tenga su propio color para
  //que sea mas facil de ver en la grilla

  //Dada la id de un elemento HTML, le pone el respectivo css para acomodarlo en la grilla
  acomodarEnGrilla(id: string, materiaObj: any) {
    let elem: HTMLElement = document.getElementById(id);
    elem.setAttribute(
      "style",
      `grid-column-start: ${this.dias.indexOf(materiaObj.dia) +
        1}; grid-column-end: ${this.dias.indexOf(materiaObj.dia) +
        2}; grid-row-start: ${this.modulo.indexOf(materiaObj.inicio) +
        1}; grid-row-end: ${this.modulo.indexOf(materiaObj.fin) + 1};`
    );
  }

  //después lo hago genérico y con mejores colores
  getColor(materia) {
    switch (materia.nombre) {
      case "Lengua":
        return "#eb9788";
      case "Matemática":
        return "#c05c7e";
      case "Física":
        return "#f3826f";
      case "Biología":
        return "#ffb961";
      case "Historia":
        return "#899857";
    }
  }
}
