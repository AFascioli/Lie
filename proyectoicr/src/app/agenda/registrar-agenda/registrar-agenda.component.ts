import { AgendaService } from '../agenda.service';
import { NgForm } from "@angular/forms";
import { element } from "protractor";
import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import Rolldate from "../../../assets/rolldate.min.js";
import { tick } from "@angular/core/testing";


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
  horarios = [1];
  materiasHTML = [[1]]; //#resolve Usado para agregar un nuevo horario

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAgenda: AgendaService
  ) {}

  ngOnInit() {
    this.obtenerCursos();
    // this.servicioAgenda.obtenerMaterias().subscribe(response => {
    //   this.materias = response.materias;
    // });

    this.servicioAgenda.obtenerDocentes().subscribe(response => {
      this.docentes = response.docentes;
    });
  }

  ngAfterViewInit() {}

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
  //que esta en el HTML que crea los cards de las materias.
  agregarMateria(indexM: number) {
    this.materiasHTML.push([1]);
  }

  //Dentro del elemento correspondiente en materias, se agrega un vector que representa los horarios
  //que va a tener esa materia (length=cantidad de horarios)
  agregarHorario(index: number) {
    this.materiasHTML[index].push(1);
  }

  //Se crea el vector materiasXCurso que es lo que se enviara al backend, luego por cada elemento del
  //vector materiasHTML (cada elemento representa a una materia y es un vector que tiene tantos elementos
  //como horarios se definieros), se crea un objeto materiaXCurso y luego se recorre el vector
  //que representa a los horarios creando un horario por cada uno de estos.
  onGuardar(form: NgForm) {
    let materiasXCurso = [];
    this.materiasHTML.forEach((materia, index) => {
      let materiaXCurso: any;
      materiaXCurso = {
        idMateria: form.value["materia" + `${index}`],
        idDocente: form.value["docente" + `${index}`],
        horarios: []
      };
      materia.forEach((horario, indice) => {
        materiaXCurso.horarios.push({
          dia: form.value["dia" + `${index}` + `${indice}`],
          horaInicio: form.value["horaInicio" + `${index}` + `${indice}`],
          horaFin: form.value["horaFin" + `${index}` + `${indice}`]
        });
      });
      materiasXCurso.push(materiaXCurso);
    });
    this.servicioAgenda.registrarAgenda(materiasXCurso, form.value.curso).subscribe(response =>{
      console.log('NICE');
    });
  }
}
