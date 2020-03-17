import { Component, OnInit, ViewChild } from "@angular/core";
import {
  MatSnackBar,
  MatTable,
  MatTableDataSource,
  MatSort
} from "@angular/material";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AgendaService } from "../agenda.service";
import { UniqueSelectionDispatcher } from "@angular/cdk/collections";

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
  dataSource = new MatTableDataSource<any>();
  indice = -1;
  cursoSelected: Boolean = false;
  mensajeError: string;
  agendaValida: Boolean = true;
  horariosReservados: any[] = [];
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
  modulos: any[] = [
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

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAgenda: AgendaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.dataSource.sort = this.sort;
    this.obtenerCursos();
    this.servicioAgenda.obtenerMaterias().subscribe(response => {
      this.materias = response.materias;
    });
    this.obtenerDocentes();
  }

  obtenerDocentes() {
    this.servicioAgenda.obtenerDocentes().subscribe(response => {
      for (let i = 0; i < response.docentes.length; i++) {
        this.docentes.push({
          _id: response.docentes[i]._id,
          nombre: `${response.docentes[i].apellido}, ${response.docentes[i].nombre}`
        });
      }
    });
  }

  obtenerAgenda(idCurso) {
    this.cursoSelected = true;
    this.servicioAgenda.obtenerAgendaDeCurso(idCurso.value).subscribe(rtdo => {
      this.dataSource.data = rtdo.agenda;
      // this.dataSource.sort
    });
  }

  reservarAgenda(indice, row) {
    this.validarHorario(row, indice);
    if (this.agendaValida) {
      this.indice = -1;
      document.getElementById("editar" + indice).style.display = "block";
      document.getElementById("reservar" + indice).style.display = "none";
    }
  }

  onGuardar() {
    if (this.agendaValida) {
      console.log(this.dataSource.data);
      this.servicioAgenda.registrarAgenda(
        this.dataSource.data,
        this.idCursoSeleccionado
      );
    } else {
      this.openSnackBar(this.mensajeError, "snack-bar-fracaso");
    }
  }

  onAgregar() {
    if (this.agendaValida) {
      this.dataSource.data.push({
        nombre: "",
        idMXC: "",
        dia: "",
        inicio: "",
        fin: "",
        idDocente: "",
        idMateria: "",
        idHorarios: ""
      });
      this.dataSource._updateChangeSubscription(); // Fuerza el renderizado de la tabla.
      console.log(this.dataSource.data);
    } else {
      this.openSnackBar(this.mensajeError, "snack-bar-fracaso");
    }
  }

  popUpCancelar() {}

  validarHorario(
    { nombreMateria, dia, inicio, fin, docente, idHorarios },
    indice
  ) {
    this.agendaValida = true;
    this.mensajeError = "";
    var moduloInicio = this.modulos.indexOf(inicio);
    var moduloFin = this.modulos.indexOf(fin);

    if (moduloInicio == -1) {
      this.agendaValida = false;
      this.mensajeError =
        "El horario de inicio seleccionado no corresponde a un módulo";
      this.openSnackBar(this.mensajeError, "snack-bar-fracaso");
    } else if (moduloFin == -1) {
      this.agendaValida = false;
      this.mensajeError =
        "El horario de fin seleccionado no corresponde a un módulo";
      this.openSnackBar(this.mensajeError, "snack-bar-fracaso");
    } else if (moduloFin <= moduloInicio) {
      this.agendaValida = false;
      this.mensajeError = "El horario de inicio es menor al horario de fin";
      this.openSnackBar(this.mensajeError, "snack-bar-fracaso");
    } else {
      for (let index = 0; index < this.dataSource.data.length; index++) {
        let moduloInicioFila = this.modulos.indexOf(
          this.dataSource[index].inicio
        );
        let moduloFinFila = this.modulos.indexOf(this.dataSource[index].fin);
        if (
          this.dataSource[index].dia == dia &&
          index != indice &&
          ((moduloInicioFila <= moduloInicio && moduloFinFila > moduloInicio) ||
            (moduloInicioFila < moduloFin && moduloFinFila >= moduloFin))
        ) {
          this.agendaValida = false;
          this.mensajeError =
            "Los horarios seleccionados entran en conflicto con otra materia";
          this.openSnackBar(this.mensajeError, "snack-bar-fracaso");
        }
      }
    }
  }

  editarAgenda(indice) {
    this.agendaValida = false;
    this.mensajeError =
      "Necesitas finalizar la edición de la correspondiente fila";
    if (this.indice != -1) {
      this.openSnackBar(this.mensajeError, "snack-bar-aviso");
      return;
    }
    this.indice = indice;
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

  openSnackBar(mensaje: string, exito: string) {
    this.snackBar.open(mensaje, "", {
      panelClass: [exito],
      duration: 4500
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
