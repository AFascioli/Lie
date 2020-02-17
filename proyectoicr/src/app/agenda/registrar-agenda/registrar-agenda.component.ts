import { NgForm } from "@angular/forms";
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
  horarios = [];
  materiasHTML = [1]; //#resolve Usado para agregar un nuevo horario

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAgenda: AgendaService
  ) {}

  ngOnInit() {
    this.obtenerCursos();
    this.servicioAgenda.obtenerMaterias().subscribe(response => {
      this.materias = response.materias;
    });

    this.servicioAgenda.obtenerDocentes().subscribe(response => {
      this.docentes = response.docentes;
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
        this.horarios.push(date);
      }
    });
    new Rolldate({
      el: id2,
      format: "hh:mm",
      minStep: 15,
      lang: { title: "Seleccione hora de fin", hour: "", min: "" },
      confirm: date => {
        this.horarios.push(date);
      }
    });
    new Rolldate({
      el: id3,
      format: "hh:mm",
      minStep: 15,
      lang: { title: "Seleccione hora de inicio", hour: "", min: "" },
      confirm: date => {
        this.horarios.push(date);
      }
    });
    new Rolldate({
      el: id4,
      format: "hh:mm",
      minStep: 15,
      lang: { title: "Seleccione hora de fin", hour: "", min: "" },
      confirm: date => {
        this.horarios.push(date);
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

  onGuardar(form: NgForm) {
    let curso = form.value.curso;
    // console.log(form.value);
    let vectorMateriasArmadas = [];
    let indiceArrayHorarios=0;
    this.materiasHTML.forEach((materia, index) => {
      let objMateriaXCurso: any;
      objMateriaXCurso = {
        idMateria: form.value["materia" + index],
        idDocente: form.value["docente" + index],
        horaInicio: this.horarios[index],
        horaFin: this.horarios[index+1],
        dia: form.value["dia" + index]
      };
      indiceArrayHorarios=+2;
      if (form.value["dia2" + index] != "") {
        objMateriaXCurso.dia2 = form.value["dia2" + index];
        objMateriaXCurso.horaInicio2 = this.horarios[index+2];
        objMateriaXCurso.horaFin2 = this.horarios[index+3];
        indiceArrayHorarios=+2;
      }
      vectorMateriasArmadas.push(objMateriaXCurso);
    });
    console.log(vectorMateriasArmadas);
  }

  //IMPORTANTE: #resolve, se debe respetar el orden de izq a der y de arriba a abajo en todos los
  //campos de hora, sino la logica de onGuardar no funciona
}
