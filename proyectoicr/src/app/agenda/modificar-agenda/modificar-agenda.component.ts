import { Component, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { AgendaService } from "src/app/visualizar-agenda/agenda.service";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";

@Component({
  selector: "app- modificar-agenda",
  templateUrl: "./modificar-agenda.component.html",
  styleUrls: ["./modificar-agenda.component.css"]
})
export class ModificarAgendaComponent implements OnInit {
  cursos: any[];
  idCursoSeleccionado: string;
  agendaCurso: any[];
  cursoSelected: Boolean = false;
  displayedColumns: string[] = [
    "Materia",
    "Docente",
    "Dia",
    "HoraInicio",
    "HoraFin",
    "Accion"
  ];
  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAgenda: AgendaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.obtenerCursos();
  }

  obtenerAgenda(idCurso){
    this.cursoSelected = true;
    this.servicioAgenda.obtenerAgendaDeCurso(idCurso.value).subscribe(rtdo => {
      this.agendaCurso = rtdo.agenda;
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
