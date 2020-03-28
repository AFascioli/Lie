import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import {
  MatSnackBar,
  MatTableDataSource,
  MatSort,
  MatDialogRef,
  MatDialog
} from "@angular/material";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AgendaService } from "../agenda.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-definir-agenda",
  templateUrl: "./definir-agenda.component.html",
  styleUrls: ["./definir-agenda.component.css"]
})
export class DefinirAgendaComponent implements OnInit, OnDestroy {
  cursos: any[];
  private unsubscribe: Subject<void> = new Subject();
  idCursoSeleccionado: string;
  materias: any[];
  isEditing: Boolean = false;
  dataSource = new MatTableDataSource<any>();
  removedDataSource = new MatTableDataSource<any>();
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
  nuevo: number;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAgenda: AgendaService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  ngOnInit() {
    this.obtenerCursos();
    this.servicioAgenda
      .obtenerMaterias()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(response => {
        this.materias = response.materias;
      });
    this.obtenerDocentes();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  obtenerDocentes() {
    this.servicioAgenda
      .obtenerDocentes()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(response => {
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
    this.servicioAgenda
      .obtenerAgendaDeCurso(idCurso.value)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(rtdo => {
        this.dataSource.data = rtdo.agenda;
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
      console.log(JSON.stringify(this.dataSource.data));
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
      let largo = this.dataSource.data.length;
      this.nuevo = largo;
      this.dataSource.data.push({
        nombre: "",
        idMXC: "",
        dia: "",
        inicio: "",
        fin: "",
        idDocente: "",
        idMateria: "",
        idHorarios: null,
        modificado: false
      });
      this.dataSource._updateChangeSubscription(); // Fuerza el renderizado de la tabla.
      setTimeout(() => {
        this.editarAgenda(largo);
      }, 100);
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
          this.dataSource.data[index].inicio
        );
        let moduloFinFila = this.modulos.indexOf(
          this.dataSource.data[index].fin
        );
        if (
          this.dataSource.data[index].dia == dia &&
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

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  editarAgenda(indice) {
    this.agendaValida = false;
    this.mensajeError =
      "Necesitas finalizar la edición de la correspondiente fila";
    if (this.indice != -1) {
      //Cuando no se esta editando/no se utiliza se valua el indice en -1.
      this.openSnackBar(this.mensajeError, "snack-bar-aviso");
    } else {
      this.dataSource.data[indice].modificado = true;
      this.indice = indice;
      let botonEditar: HTMLElement = document.getElementById("editar" + indice);
      let botonReservar: HTMLElement = document.getElementById(
        "reservar" + indice
      );
      botonEditar.style.display = "none";
      botonReservar.style.display = "block";
    }
  }

  popupEliminar(index) {
    const dialogoElim = this.dialog.open(AgendaPopupComponent, {
      width: "250px"
    });

    dialogoElim
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(result => {
        result && this.eliminarHorarios(index);
      });
  }

  eliminarHorarios(index) {
    this.removedDataSource.data.push(this.dataSource.data.splice(index, 1)[0]);
    this.dataSource._updateChangeSubscription();
    console.log("RemovedDataSource", this.removedDataSource.data);
  }

  openSnackBar(mensaje: string, exito: string) {
    this.snackBar.open(mensaje, "", {
      panelClass: [exito],
      duration: 4500
    });
  }

  obtenerCursos() {
    this.servicioEstudiante
      .obtenerCursos()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(response => {
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

@Component({
  selector: "app-agenda-popup",
  templateUrl: "./agenda-popup.component.html",
  styleUrls: ["./definir-agenda.component.css"]
})
export class AgendaPopupComponent {
  constructor(public dialogRef: MatDialogRef<AgendaPopupComponent>) {}
  onYesClick(): void {
    this.dialogRef.close(true);
  }
  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
