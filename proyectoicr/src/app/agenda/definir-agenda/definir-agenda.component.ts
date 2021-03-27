import { AutenticacionService } from "src/app/login/autenticacionService.service";
import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import {
  MatSnackBar,
  MatTableDataSource,
  MatSort,
  MatDialogRef,
  MatDialog,
} from "@angular/material";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AgendaService } from "../agenda.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CancelPopupComponent } from "src/app/popup-genericos/cancel-popup.component";
import { Router } from "@angular/router";
import { MediaMatcher } from "@angular/cdk/layout";
import { NgModel } from "@angular/forms";
import { CicloLectivoService } from "src/app/cicloLectivo.service";

@Component({
  selector: "app-definir-agenda",
  templateUrl: "./definir-agenda.component.html",
  styleUrls: ["./definir-agenda.component.css"],
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
  cursoSeleccionado: string;
  yearSelected: any = 0;
  nextYearSelect: boolean;
  agendaValida: Boolean = true;
  horariosReservados: any[] = [];
  dias: any[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  displayedColumns: string[] = [
    "Materia",
    "Docente",
    "Dia",
    "HoraInicio",
    "HoraFin",
    "Accion",
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
    "14:15",
  ];
  nuevo: number;
  indiceNuevo: number[] = [];
  indiceEditando: number = -1;
  isLoading = false;
  huboCambios = false;
  permiteModificarAgenda = false;
  cicloLectivoActualEnCreado = false;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  aniosCiclos: any[];
  enEstadoCLCursando;
  seClono = false;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioAgenda: AgendaService,
    public servicioAuth: AutenticacionService,
    public cicloLectivoService: CicloLectivoService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher,
    public servicioCicloLectivo: CicloLectivoService
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 880px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  ngOnInit() {
    this.isLoading = true;

    this.servicioCicloLectivo
      .obtenerActualYSiguiente()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.cicloLectivoService
          .obtenerEstadoCicloLectivo()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response2) => {
            this.aniosCiclos = response.añosCiclos;
            this.enEstadoCLCursando =
              response2.estadoCiclo == "En primer trimestre" ||
              response2.estadoCiclo == "En segundo trimestre" ||
              response2.estadoCiclo == "En tercer trimestre";
            this.isLoading = false;
          });
      });

    this.servicioAgenda
      .obtenerMaterias()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
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
      .subscribe((response) => {
        for (let i = 0; i < response.docentes.length; i++) {
          this.docentes.push({
            _id: response.docentes[i]._id,
            nombre: `${response.docentes[i].apellido}, ${response.docentes[i].nombre}`,
          });
        }
        this.docentes.sort((a, b) =>
          a.nombre.charAt(0) > b.nombre.charAt(0)
            ? 1
            : b.nombre.charAt(0) > a.nombre.charAt(0)
            ? -1
            : 0
        );
      });
  }

  obtenerAgenda(idCurso: NgModel) {
    if (!this.isEditing) {
      this.isLoading = true;
      this.cursoSelected = true;
      this.idCursoSeleccionado = idCurso.value;
      this.servicioAgenda
        .obtenerAgendaDeCurso(this.idCursoSeleccionado)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((rtdo) => {
          this.dataSource.data = rtdo.agenda;
          this.huboCambios = false;
          this.isLoading = false;
        });
    } else {
      idCurso.reset(this.idCursoSeleccionado);
      this.openSnackBar(
        "Necesitas finalizar la edición de la correspondiente fila",
        "snack-bar-fracaso"
      );
    }
  }

  onClonar() {
    this.dialog
      .open(ConfirmacionClonarPopupComponent, {
        width: "250px",
      })
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((confirmacion) => {
        if (confirmacion) {
          this.isLoading = true;
          this.servicioAgenda
            .obtenerAgendaAnterior(this.idCursoSeleccionado)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((rtdo) => {
              this.isLoading = false;
              this.seClono = true;
              this.huboCambios = true;
              this.dataSource.data = rtdo.agenda;
              this.dataSource._updateChangeSubscription();
              if (rtdo.exito) {
                this.openSnackBar(rtdo.message, "snack-bar-exito");
              } else {
                this.openSnackBar(rtdo.message, "snack-bar-fracaso");
              }
            });
        }
      });
  }

  obtenerCursos() {
    this.isLoading = true;
    this.servicioEstudiante
      .obtenerCursos(this.yearSelected)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.isLoading = false;
        this.cursos = response.cursos;
        this.cursos.sort((a, b) =>
          a.nombre.charAt(0) > b.nombre.charAt(0)
            ? 1
            : b.nombre.charAt(0) > a.nombre.charAt(0)
            ? -1
            : a.nombre.charAt(1) > b.nombre.charAt(1)
            ? 1
            : b.nombre.charAt(1) > a.nombre.charAt(1)
            ? -1
            : 0
        );
      });
  }

  reservarAgenda(indice, row) {
    if (row.idMateria == "" || row.dia == "" || row.idDocente == "") {
      this.agendaValida = false;
      this.mensajeError = "Faltan campos por completar";
      this.openSnackBar(this.mensajeError, "snack-bar-fracaso");
    } else {
      this.validarHorario(row, indice);
      if (this.agendaValida) {
        this.indiceEditando = -1;
        this.indice = -1;
        this.isEditing = false;
        document.getElementById("editar" + indice).style.display = "block";
        document.getElementById("reservar" + indice).style.display = "none";
      }
    }
  }

  onGuardar(curso: NgModel) {
    if (this.agendaValida) {
      this.isLoading = true;
      this.servicioAgenda
        .registrarAgenda(
          this.dataSource.data,
          this.idCursoSeleccionado,
          this.seClono
        )
        .subscribe((response) => {
          this.obtenerAgenda(curso)
          this.isLoading = false;
          this.isEditing = false;
          this.huboCambios = false;
          this.seClono = false;
          this.indiceNuevo = [];
          this.openSnackBar(response.message, "snack-bar-exito");
        });
    } else {
      this.openSnackBar(this.mensajeError, "snack-bar-fracaso");
    }
  }

  onAgregar() {
    if (this.agendaValida) {
      let largo = this.dataSource.data.length;
      this.nuevo = largo;
      this.indiceNuevo.push(this.dataSource.data.length);
      this.dataSource.data.push({
        nombre: "",
        idMXC: "",
        dia: "",
        inicio: "",
        fin: "",
        idDocente: "",
        idMateria: "",
        idHorarios: null,
        modificado: false,
      });
      this.dataSource._updateChangeSubscription(); // Fuerza el renderizado de la tabla.
      setTimeout(() => {
        this.isEditing = true;
        this.editarAgenda(largo);
      }, 100);
    } else {
      this.openSnackBar(this.mensajeError, "snack-bar-fracaso");
    }
  }

  popUpCancelar() {
    if (!this.cursoSelected) {
      this.router.navigate(["./home"]);
    } else {
      this.dialog.open(CancelPopupComponent, {
        width: "250px",
      });
    }
  }

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
      this.mensajeError = "El horario de fin no es mayor al horario de inicio";
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
    this.indiceEditando = indice;
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
      width: "250px",
    });

    dialogoElim
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((result) => {
        if (this.dataSource.data[index].idMXC == "") {
          //Si se agrego un horario nuevo y se lo quiere borrar inmediatamente
          if (result) {
            this.removedDataSource.data.push(
              this.dataSource.data.splice(index, 1)[0]
            );
            this.dataSource._updateChangeSubscription();
            this.agendaValida = true;
            this.mensajeError = "";
            this.indice = -1;
            this.isEditing = false;
          }
        } else {
          result && this.eliminarHorarios(index);
        }
      });
  }

  eliminarHorarios(index) {
    this.servicioAgenda
      .eliminarHorario(this.dataSource.data[index], this.idCursoSeleccionado)
      .subscribe((response) => {
        this.openSnackBar(response.message, "snack-bar-exito");
        this.removedDataSource.data.push(
          this.dataSource.data.splice(index, 1)[0]
        );
        this.dataSource._updateChangeSubscription();
      });
  }

  openSnackBar(mensaje: string, exito: string) {
    this.snackBar.open(mensaje, "", {
      panelClass: [exito],
      duration: 4500,
    });
  }

  onYearSelected(yearSelected) {
    this.cursoSelected = false;
    if (yearSelected.value == "actual") {
      this.yearSelected = this.aniosCiclos[0];
      this.nextYearSelect = false;
      // this.servicioCicloLectivo
      //   .validarModificarAgenda()//Redundante
      //   .pipe(takeUntil(this.unsubscribe))
      //   .subscribe((response) => {
      //     this.permiteModificarAgenda = response.puedeModificar;
      //     this.cicloLectivoActualEnCreado = response.creado;
      //   });
    } else {
      this.yearSelected = this.aniosCiclos[1];
      this.nextYearSelect = true;
      // this.cicloLectivoActualEnCreado = true;
    }
    this.dataSource.data = [];
    this.obtenerCursos();
  }

  esNuevo(indice): boolean {
    return this.indiceNuevo.includes(indice);
  }

  setCambios() {
    this.huboCambios = true;
  }
}

@Component({
  selector: "app-agenda-popup",
  templateUrl: "./agenda-popup.component.html",
  styleUrls: ["./definir-agenda.component.css"],
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

@Component({
  selector: "app-clonar-popup",
  templateUrl: "./confirmacion-clonar-popup.component.html",
  styleUrls: ["./definir-agenda.component.css"],
})
export class ConfirmacionClonarPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmacionClonarPopupComponent>,
    public router: Router
  ) {}

  onYesClick(): void {
    this.dialogRef.close(true);
  }
  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
