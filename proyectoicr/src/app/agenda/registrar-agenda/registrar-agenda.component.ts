import { NgForm } from "@angular/forms";
import { element } from "protractor";
import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import Rolldate from "../../../assets/rolldate.min.js";
import { tick } from "@angular/core/testing";
import { AgendaService } from "src/app/visualizar-agenda/agenda.service.js";
import { MatSnackBar } from '@angular/material';

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
  horariosReservados = [];
  modulos=[
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
  horariosValidos=true;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAgenda: AgendaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.obtenerCursos();
    this.servicioAgenda.obtenerMaterias().subscribe(response => {
      this.materias = response.materias;
    });

    this.servicioAgenda.obtenerDocentes().subscribe(response => {
      this.docentes = response.docentes;
    });
    for(var i=0; i<9; i++) {
      this.horariosReservados[i] = [];
      for(var j=0; j<5; j++) {
        this.horariosReservados[i][j] = false;
      }
  }
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
  agregarHorario(index: number, form: NgForm) {
    this.materiasHTML[index].push(1);
    var res=this.reservarHorario(form);
    if(!res.resultado){
      this.materiasHTML[index].pop();
      this.snackBar.open(res.mensaje, "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4500
      });
    }
  }

  //TEST
  //j=materiasHTML.length, i=materiasHTML[j].length
  reservarHorario(form: NgForm) {
    var j=this.materiasHTML.length-1;
    var i= this.materiasHTML[this.materiasHTML.length-1].length-2;
    var horaInicio=form.value["horaInicio" + `${j}` + `${i}`];
    var horaFin=form.value["horaFin" + `${j}` + `${i}`];
    var dia= form.value["dia" + `${j}` + `${i}`];
    var diaMatrix= this.dias.indexOf(dia);
    var moduloInicio= this.modulos.indexOf(horaInicio);
    var moduloFin= this.modulos.indexOf(horaFin);
    if(moduloFin<moduloInicio){
      return {resultado:false, mensaje: "El horario de inicio es menor al horario de fin"};
    }
    var cantidadModulos=moduloFin-moduloInicio;
    for(var index=moduloInicio; index<moduloInicio+cantidadModulos; index++){
      if(this.horariosReservados[index][diaMatrix]){

        return {resultado:false, mensaje: "Los horarios seleccionados entran en conflicto con otra materia"};
      }
        this.horariosReservados[index][diaMatrix]=true;

    }
    return {resultado:true, mensaje: ""};
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
    this.servicioAgenda
      .registrarAgenda(materiasXCurso, form.value.curso)
      .subscribe(response => {
        console.log("NICE");
      });
  }
}
