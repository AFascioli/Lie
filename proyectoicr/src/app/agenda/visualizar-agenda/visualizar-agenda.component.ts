import { AgendaService } from "../agenda.service";
import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";

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
  cursos: any[];
  materiasDistintas = [];
  cursoSelected: Boolean;
  colores = [];
  materias = [];
  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAgenda: AgendaService
  ) {}

  ngOnInit() {
    this.servicioAgenda
      .obtenerAgendaDeCurso("idCurso.value")
      .subscribe(agenda => {
        this.materias = agenda.agenda;
        console.log(agenda.agenda);
        this.obtenerCursos();
        this.getMateriasDistintas();
        this.getColorVector();
      });
  }

  obtenerAgenda(idCurso) {
    this.cursoSelected = true;
  }

  //Este metodo dado por angular se ejecuta una vez que se cargo todo el html
  ngAfterViewInit() {
    this.materias.forEach((materia, index) => {
      this.acomodarEnGrilla(index.toString(), materia);
    });
  }

  obtenerCursos() {
    this.servicioEstudiante.obtenerCursos().subscribe(response => {
      this.cursos = response.cursos;
      this.cursos.sort((a, b) =>
        a.curso.charAt(0) > b.curso.charAt(0)
          ? 1
          : b.curso.charAt(0) > a.curso.charAt(0)
          ? -1
          : 0
      );
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

  getColorVector() {
    this.colores[0] = "#eb9788";
    this.colores[1] = "#c05c7e";
    this.colores[2] = "#f3826f";
    this.colores[3] = "#ffb961";
    this.colores[4] = "#899857";
    this.colores[5] = "#ba6b57";
    this.colores[6] = "#e7b2a5";
    this.colores[7] = "#6e5773";
    this.colores[8] = "#f1935c";
    this.colores[9] = "#a3f7bf";
    this.colores[10] = "#ce0f3d";
  }

  getMateriasDistintas() {
    for (let i = 0; i < this.materias.length; i++) {
      if (
        this.materiasDistintas.length == 0 ||
        !this.materiasDistintas.includes(this.materias[i].nombre)
      )
        this.materiasDistintas.push(this.materias[i].nombre);
    }
    this.materiasDistintas.sort();
  }

  getColores(materia) {
    for (let i = 0; i < this.materiasDistintas.length; i++) {
      if (this.materiasDistintas[i] == materia) {
        return this.colores[i];
      }
    }
  }

  //después lo hago genérico y con mejores colores
  // getColor(materia) {
  //   switch (materia.nombre) {
  //     case "Lengua":
  //       return "#eb9788";
  //     case "Matemática":
  //       return "#c05c7e";
  //     case "Física":
  //       return "#f3826f";
  //     case "Biología":
  //       return "#ffb961";
  //     case "Historia":
  //       return "#899857";
  //   }
  // }
}
