import { NgForm, NgModel } from "@angular/forms";
import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AgendaService } from "src/app/visualizar-agenda/agenda.service.js";
import { MatSnackBar } from "@angular/material";

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
  modulos = [
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
  agendaValida = true;
  mensajeError="";
  materiasSeleccionadas=[];

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
    for (var i = 0; i < 9; i++) {
      this.horariosReservados[i] = [];
      for (var j = 0; j < 5; j++) {
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

  //Chequea que no haya conflicto entre los horarios. si no hay, agrega un elemento
  //al vector materiasHTML para que se triggeree otra vuelta del for
  //que esta en el HTML que crea los cards de las materias.
  agregarMateria() {
    if(this.agendaValida){
      this.materiasHTML.push([1]);
    }else{
      this.openSnackBar(this.mensajeError,"snack-bar-fracaso")
    }
  }

  //Dentro del elemento correspondiente en materias, se agrega un vector que representa los horarios
  //que va a tener esa materia (length=cantidad de horarios)
  agregarHorario(index: number) {
    if(this.agendaValida){
      this.materiasHTML[index].push(1);
    }else{
      this.openSnackBar(this.mensajeError,"snack-bar-fracaso")
    }
  }

  //Este metodo recibe la hora inicio, la hora fin y el dia de una materia, si horaInicioMateria
  //tiene el valor "horaIncio"j+i (viene del html), se debe buscar en el form su valor. En cambio
  //si hora fin tiene el valor "horaFin"+j+i, se debe buscar su valor. Luego nos fijamos si ambas
  //tienen valor. Si tienen, nos fijamos que los modulos sean correctos. Por ultimo, se cambia
  //el valor correspondiente de la matriz horariosReservados a true (un por cada modulo de la materia)
  //Si existe conflicto entre los horarios, cambia el valor de los atributos horariosValidos y mensajeError.
  reservarHorario(
    form: NgForm,
    horaInicioMateria: string,
    horaFinMateria: string,
    diaMateria: string
  ) {
    var horaInicio;
    var horaFin;
    if (horaInicioMateria.localeCompare("hora") == 1) {
      horaInicio = form.value[horaInicioMateria];
      horaFin = horaFinMateria;
    } else {
      horaFin = form.value[horaFinMateria];
      horaInicio = horaInicioMateria;
    }
    if (!(horaInicio && horaFin)) {
      return;
    } else {
      var dia = form.value[diaMateria];
      var diaMatrix = this.dias.indexOf(dia);
      var moduloInicio = this.modulos.indexOf(horaInicio);
      var moduloFin = this.modulos.indexOf(horaFin);
      var cantidadModulos = moduloFin - moduloInicio;
      if (moduloFin <= moduloInicio) {
        this.agendaValida=false;
        this.mensajeError="El horario de inicio es menor al horario de fin";
        this.openSnackBar(this.mensajeError,"snack-bar-fracaso");
        return;
      }
      for (
        var index = moduloInicio;
        index < moduloInicio + cantidadModulos;
        index++
      ) {
        if (this.horariosReservados[index][diaMatrix]) {
        this.agendaValida=false;
        this.mensajeError="Los horarios seleccionados entran en conflicto con otra materia";
        this.openSnackBar(this.mensajeError,"snack-bar-fracaso");
          return;
        }
        this.horariosReservados[index][diaMatrix] = true;
      }
      this.agendaValida=true;
      this.mensajeError="";
      return;
    }
  }

  //Se crea el vector materiasXCurso que es lo que se enviara al backend, luego por cada elemento del
  //vector materiasHTML (cada elemento representa a una materia y es un vector que tiene tantos elementos
  //como horarios se definieros), se crea un objeto materiaXCurso y luego se recorre el vector
  //que representa a los horarios creando un horario por cada uno de estos.
  onGuardar(form: NgForm) {
    if(form.valid&&this.agendaValida){
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
    }else{
      if(form.invalid){
        this.openSnackBar("Faltan campos por completar","snack-bar-fracaso");
      }else{
        this.openSnackBar(this.mensajeError,"snack-bar-fracaso");
      }
    }
  }

  //Recibe el modelo de materia del HTML y agrega la id de la materia al vector materiasSeleccionadas
  //si es que la materia no fue seleccionada anteriormente, en ese caso muestra error.
  validarMateria(materia: NgModel){
    var idMateria=materia.value;
    this.materiasSeleccionadas.forEach(materia => {
      if(materia==idMateria){
        this.mensajeError="La materia ya fue seleccionada anteriormente";
        this.agendaValida=false;
        this.openSnackBar(this.mensajeError,"snack-bar-fracaso");
        return;
      }
    });
    this.materiasSeleccionadas.push(idMateria);
  }

  openSnackBar(mensaje:string,exito:string){
    this.snackBar.open(
      mensaje,
      "",
      {
        panelClass: [exito],
        duration: 4500
      }
    );
  }
}
