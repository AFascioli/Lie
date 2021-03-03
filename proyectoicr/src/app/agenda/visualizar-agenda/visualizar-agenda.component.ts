import { CicloLectivoService } from "./../../cicloLectivo.service";
import { AgendaService } from "../agenda.service";
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { MatSnackBar } from "@angular/material";
import { MediaMatcher } from "@angular/cdk/layout";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-visualizar-agenda",
  templateUrl: "./visualizar-agenda.component.html",
  styleUrls: ["./visualizar-agenda.component.css"],
})
export class VisualizarAgendaComponent implements OnInit, OnDestroy {
  dias = ["Hora", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  //Agrego Hora en los dos vectores para que el calculo sea siempre +1 +2
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
    "14:15",
  ];
  idCurso: any;
  cursos: any[];
  materiasDistintas = [];
  cursoSelected: Boolean = false;
  colores = [];
  materias: any[] = [];
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  private unsubscribe: Subject<void> = new Subject();
  isLoading = true;
  agendaVacia: boolean = false;
  yearSelected;
  nextYearSelect;
  aniosCiclos: any[];

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAgenda: AgendaService,
    public servicioCicloLectivo: CicloLectivoService,
    public snackBar: MatSnackBar,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 880px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.servicioCicloLectivo
      .obtenerActualYSiguiente()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.aniosCiclos = response.añosCiclos;
        this.isLoading = false;
      });
  }

  // Obtiene la agenda de un curso y le asigna a las materias un color distinto
  async obtenerAgenda(idCurso) {
    return new Promise((resolve, reject) => {
      this.servicioAgenda
        .obtenerAgendaDeCurso(idCurso)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(async (agenda) => {
          if (agenda.exito) this.cursoSelected = true;
          this.materias = agenda.agenda;
          this.getMateriasDistintas();
          this.getColorVector();
          resolve(agenda.agenda);
        });
    });
  }

  //Muestran en la interfaz los diferentes horarios de la materia
  actualizarInterfaz(idCurso) {
    (async () => {
      let agenda: any = await this.obtenerAgenda(idCurso.value);
      if (agenda.length != 0) {
        agenda.forEach((materia, index) => {
          this.setInGrid(index.toString(), materia);
          this.agendaVacia = false;
        });
      } else {
        this.agendaVacia = true;
      }
    })();
  }

  onYearSelected(yearSelected) {
    this.cursoSelected = false;
    if (yearSelected.value == "actual") {
      this.yearSelected = this.aniosCiclos[0];
      this.nextYearSelect = false;
    } else {
      this.yearSelected = this.aniosCiclos[1];
      this.nextYearSelect = true;
    }
    this.obtenerCursos();
  }

  obtenerCursos() {
    this.servicioEstudiante
      .obtenerCursos(this.yearSelected)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.cursos = response.cursos;
        this.cursos.sort((a, b) =>
          a.nombre.charAt(0) > b.nombre.charAt(0)
            ? 1
            : b.nombre.charAt(0) > a.nombre.charAt(0)
            ? -1
            : 0
        );
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  //Dada la id de un elemento HTML, le asocia el estilo correspondiente (css) para su correcta
  //visualización en la grilla
  setInGrid(id: string, materiaObj: any) {
    setTimeout(() => {
      let elem: HTMLElement = document.getElementById(id);
      elem.setAttribute(
        "style",
        `grid-column-start: ${
          this.dias.indexOf(materiaObj.dia) + 1
        }; grid-column-end: ${
          this.dias.indexOf(materiaObj.dia) + 2
        }; grid-row-start: ${
          this.modulo.indexOf(materiaObj.inicio) + 1
        }; grid-row-end: ${this.modulo.indexOf(materiaObj.fin) + 1};`
      );
    }, 10);
  }

  getColorVector() {
    this.colores[0] = "#0794DB"; // azul
    this.colores[1] = "#08AF1C"; // verde
    this.colores[2] = "#FF5733"; // naranja
    this.colores[3] = "#DCA801"; // amarillo
    this.colores[4] = "#900C3F"; // bordo
    this.colores[5] = "#9003CD"; // morado
    this.colores[6] = "#03B0A5"; // celeste
    this.colores[7] = "#383838"; // negro
    this.colores[8] = "#CE0090"; // rosa
    this.colores[9] = "#81B002"; // verde mar
    this.colores[10] = "#CD170B"; // rojo
  }

  getMateriasDistintas() {
    this.materiasDistintas = [];
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
