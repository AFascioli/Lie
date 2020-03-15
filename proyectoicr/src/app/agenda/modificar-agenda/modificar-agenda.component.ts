import { Component, OnInit } from "@angular/core";
import { MatSnackBar, MatTable } from "@angular/material";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AgendaService } from "../agenda.service";

@Component({
  selector: "app- modificar-agenda",
  templateUrl: "./modificar-agenda.component.html",
  styleUrls: ["./modificar-agenda.component.css"]
})
export class ModificarAgendaComponent implements OnInit {
  cursos: any[];
  idCursoSeleccionado: string;
  materias: any[];
  isEditing: Boolean = false;
  dataSource: any[];
  cursoSelected: Boolean = false;
  dias: any[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  displayedColumns: string[] = [
    "Materia",
    "Docente",
    "Dia",
    "HoraInicio",
    "HoraFin",
    "Accion"
  ];
  docentes: any[] = [];

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

    this.obtenerDocentes();
  }

  obtenerDocentes() {
    this.servicioAgenda.obtenerDocentes().subscribe(response => {
      for (let i = 0; i < response.docentes.length; i++) {
        this.docentes.push(
          `${response.docentes[i].apellido}, ${response.docentes[i].nombre}`
        );
      }
    });
  }

  obtenerAgenda(idCurso) {
    this.cursoSelected = true;
    this.servicioAgenda.obtenerAgendaDeCurso(idCurso.value).subscribe(rtdo => {
      this.dataSource = rtdo.agenda;
    });
  }

  reservarAgenda(indice) {
    let botonEditar: HTMLElement = document.getElementById("editar" + indice);
    let botonReservar: HTMLElement = document.getElementById(
      "reservar" + indice
    );
    botonEditar.style.display = "block";
    botonReservar.style.display = "none";
  }

  editarAgenda(indice, tabla: MatTable<any>) {
    let botonEditar: HTMLElement = document.getElementById("editar" + indice);
    let botonReservar: HTMLElement = document.getElementById(
      "reservar" + indice
    );
    botonEditar.style.display = "none";
    botonReservar.style.display = "block";
  }

  eliminarHorarios(agendaCurso) {
    this.servicioAgenda
      .eliminarHorarios(
        this.idCursoSeleccionado,
        agendaCurso.idHorarios,
        agendaCurso.nombre
      )
      .subscribe(rtdo => {
        console.log(rtdo);
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
}
