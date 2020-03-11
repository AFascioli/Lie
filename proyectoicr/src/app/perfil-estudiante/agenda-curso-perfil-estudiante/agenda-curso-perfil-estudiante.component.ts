import { Component, OnInit } from "@angular/core";
import { Estudiante } from "src/app/estudiantes/estudiante.model";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Router } from "@angular/router";
import { AgendaService } from "src/app/agenda/agenda.service";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-agenda-curso-perfil-estudiante",
  templateUrl: "./agenda-curso-perfil-estudiante.component.html",
  styleUrls: ["./agenda-curso-perfil-estudiante.component.css"]
})
export class AgendaCursoPerfilEstudianteComponent implements OnInit {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;
  cursoEstudiante: string;
  materias: any[];
  dias = ["Hora", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]; //Agrego Hora en los dos vectores para que el calculo sea siempre +1 +2
  modulo = [
    "Hora",
    "07:30",
    "08:15",
    "09:00",
    "09:45",
    "10:30",
    "11:15",
    "12:00",
    "12:45",
    "13:30",
    "14:15"
  ];
  materiasDistintas: any[] = [];
  colores: any[] = [];

  constructor(
    public servicio: EstudiantesService,
    public router: Router,
    public servicioAgenda: AgendaService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicio.estudianteSeleccionado._id;
    this.actualizarInterfaz();
    // console.log('idEstudiante:'+ this._idEstudiante);
    // this.servicioAgenda.obtenerAgendaDeCursoByIdEstudiante(this._idEstudiante).subscribe( respuesta => {
    //   console.log('Respuesta de agenda:' + respuesta.agenda);
    //    this.materias = respuesta.agenda;
    // });
  }

  // Obtiene la agenda de un curso y le asigna a las materias un color distinto
  async obtenerAgenda() {
    return new Promise((resolve, reject) => {
      this.servicioAgenda
        .obtenerAgendaDeCursoByIdEstudiante(this._idEstudiante)
        .subscribe(async rtdo => {
          if (rtdo.exito) {
            this.snackBar.open(rtdo.message, "", {
              panelClass: ["snack-bar-exito"],
              duration: 3000
            });
          } else {
            this.snackBar.open(rtdo.message, "", {
              panelClass: ["snack-bar-fracaso"],
              duration: 3000
            });
          }
          this.materias = rtdo.agenda;
          console.log(this.materias);
          this.getMateriasDistintas();
          this.getColorVector();
          resolve(rtdo.agenda);
        });
    });
  }

  //Muestran en la interfaz los diferentes horarios de la materia
  actualizarInterfaz() {
    (async () => {
      let agenda: any = await this.obtenerAgenda();
      agenda.forEach((materia, index) => {
        this.setInGrid(index.toString(), materia);
      });
    })();
  }

  //Dada la id de un elemento HTML, le asocia el estilo correspondiente (css) para su correcta
  //visualización en la grilla
  setInGrid(id: string, materiaObj: any) {
    setTimeout(() => {
      let elem: HTMLElement = document.getElementById(id);
      elem.setAttribute(
        "style",
        `grid-column-start: ${this.dias.indexOf(materiaObj.dia) +
          1}; grid-column-end: ${this.dias.indexOf(materiaObj.dia) +
          2}; grid-row-start: ${this.modulo.indexOf(materiaObj.inicio) +
          1}; grid-row-end: ${this.modulo.indexOf(materiaObj.fin) + 1};`
      );
    }, 10);
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
}
