import { element } from "protractor";
import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import Rolldate from "../../../assets/rolldate.min.js";
import { tick } from "@angular/core/testing";
import { AgendaService } from "src/app/visualizar-agenda/agenda.service.js";

@Component({
  selector: "app-registrar-agenda",
  templateUrl: "./registrar-agenda.component.html",
  styleUrls: ["./registrar-agenda.component.css"]
})
export class RegistrarAgendaComponent implements OnInit {
  cursos: any[];
  idCursoSeleccionado: string;
  materias: any[];
  docentes: any[];
  dias: any[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  horaInicio: any;
  horaFin: any;
  elementos = [1]; //#resolve Usado para agregar un nuevo horario
  materiasHTML = [1]; //#resolve Usado para agregar un nuevo horario

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAgenda: AgendaService
  ) {}

  ngOnInit() {
    this.obtenerCursos();
    this.servicioAgenda.obtenerMaterias().subscribe(response => {
      // this.materias=response.materias;
      console.log(response);
    });

    this.servicioAgenda.obtenerDocentes().subscribe(response => {
      // this.docentes=response.docentes;
      console.log(response);
    });
  }

  ngAfterViewInit() {
    this.inicializarPickers(
      "#pickerInicio0",
      "#pickerFin0",
      "#pickerInicio20",
      "#pickerFin20"
    );

  }

  //Se inicializar los 4 pickers de cada materia
  inicializarPickers(id1: string, id2: string, id3: string, id4: string) {
    new Rolldate({
      el: id1,
      format: "hh:mm",
      minStep: 15,
      lang: {
        title: "Seleccione hora de inicio",
        hour: "",
        min: ""
      },
      confirm: date => {
        this.horaInicio = date;
      }
    });
    new Rolldate({
      el: id2,
      format: "hh:mm",
      minStep: 15,
      lang: { title: "Seleccione hora de fin", hour: "", min: "" },
      confirm: date => {
        this.horaFin = date;
      }
    });
    new Rolldate({
      el: id3,
      format: "hh:mm",
      minStep: 15,
      lang: { title: "Seleccione hora de inicio", hour: "", min: "" },
      confirm: date => {
        this.horaFin = date;
      }
    });
    new Rolldate({
      el: id4,
      format: "hh:mm",
      minStep: 15,
      lang: { title: "Seleccione hora de fin", hour: "", min: "" },
      confirm: date => {
        this.horaFin = date;
      }
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

  //Agrega un elemento al vector materiasHTML para que se triggeree otra vuelta del for
  //que esta en el HTML que crea los cards de las materias. Se usa un time out para que se cargue primero
  //el HTML y luego se le pueda asignar un rolldate a los elementos creados
  //#resolve
  agregarMateria(indexM: number) {
    this.materiasHTML.push(1);
    setTimeout(() => {
      this.inicializarPickers(
        "#pickerInicio" + indexM,
        "#pickerFin" + indexM,
        "#pickerInicio2" + indexM,
        "#pickerFin2" + indexM
      );
    }, 1000);
  }
}
