import { element } from 'protractor';
import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import Rolldate from "../../../assets/rolldate.min.js";
import { tick } from '@angular/core/testing';

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
  dias: any[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horaInicio: any;
  horaFin: any;
  elementos=[1]; //#resolve Usado para agregar un nuevo horario

  constructor(public servicioEstudiante: EstudiantesService) {}

  ngOnInit() {
    this.obtenerCursos();
  }

  ngAfterViewInit(){
    this.inicializarPickers("#pickerInicio0","#pickerFin0");
  }

  obtenerMaterias(idCurso){
    this.servicioEstudiante.obtenerMateriasDeCurso(idCurso.value).subscribe(rtdo => {
      this.materias = rtdo.materias;
    });
  }

  inicializarPickers(id1:string, id2:string) {
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

  //Agrega un elemento al vector elementos para que se triggeree otra vuelta del for
  //que esta en el HTML que crea los horarios. Se usa un time out para que se cargue primero
  //el HTML y luego se le pueda asignar un rolldate a los elementos creados
  //#resolve
  agregarHorario(index: number){
    this.elementos.push(1);
    setTimeout(()=>{
      new Rolldate({
        el: "#pickerInicio"+index,
        format: "hh:mm",
        minStep: 15,
        lang: {
          title: "Seleccione hora de inicio",
          hour: "",
          min: ""
        }
      });
      new Rolldate({
        el: "#pickerFin"+index,
        format: "hh:mm",
        minStep: 15,
        lang: {
          title: "Seleccione hora de fin",
          hour: "",
          min: ""
        }
      });
    }, 1000);
  }
}
