import { CancelPopupComponent } from "src/app/popup-genericos/cancel-popup.component";
import { AutenticacionService } from "../../login/autenticacionService.service";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { MatDialog, MatSnackBar, MatDialogRef } from "@angular/material";
import { NgForm, NgModel } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { CalificacionesService } from "../calificaciones.service";
import { MatPaginatorIntl } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
  selector: "app-calificaciones-estudiantes",
  templateUrl: "./calificaciones-estudiantes.component.html",
  styleUrls: ["./calificaciones-estudiantes.component.css"],
})
export class CalificacionesEstudiantesComponent implements OnInit, OnDestroy {
  cursos: any[];
  materias: any[];
  estudiantes: any[] = [];
  displayedColumns: string[] = [
    "apellido",
    "nombre",
    "cal1",
    "cal2",
    "cal3",
    "cal4",
    "cal5",
    "cal6",
    "prom",
  ];
  trimestreSeleccionado: string;
  trimestreActual: string = "fuera";
  idDocente: string;
  rolConPermisosEdicion = false;
  isLoading = true;
  isLoading2 = false;
  fechaActual: Date;
  calificacionesChange = false;
  puedeEditarCalificaciones = false;
  promedio = 0;
  dataSource: MatTableDataSource<any>;
  indexEst = 0;
  cursoSeleccionado: boolean = false;
  materiaSeleccionada: boolean = false;
  filtroEstudiante: string;
  private unsubscribe: Subject<void> = new Subject();
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  @ViewChild("comboCurso", { static: false }) comboCurso: any;
  @ViewChild("comboTrimestre", { static: false }) comboTrimestre: any;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioCalificaciones: CalificacionesService,
    public popup: MatDialog,
    private snackBar: MatSnackBar,
    public servicioAutenticacion: AutenticacionService,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 880px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.fechaActual = new Date();
    this.obtenerTrimestreActual();
    this.validarPermisos();
    this.obtenerCursos();
    this.servicioCalificaciones.auxCambios = false;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  validarPermisos() {
    this.servicioAutenticacion
      .obtenerPermisosDeRol()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res.permisos.notas == 2) {
          this.rolConPermisosEdicion = true;
        }
        this.isLoading = false;
      });
  }

  obtenerCursos() {
    if (this.servicioAutenticacion.getRol() == "Docente") {
      this.servicioAutenticacion
        .obtenerIdEmpleado(this.servicioAutenticacion.getId())
        .subscribe((response) => {
          this.idDocente = response.id;
          this.servicioEstudiante
            .obtenerCursosDeDocente(this.idDocente)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((response) => {
              this.cursos = response.cursos;
              this.cursos.sort((a, b) =>
                a.nombre.charAt(0) > b.nombre.charAt(0)
                  ? 1
                  : b.nombre.charAt(0) > a.nombre.charAt(0)
                  ? -1
                  : 0
              );
            });
        });
    } else {
      this.servicioEstudiante
        .obtenerCursos(this.fechaActual.getFullYear())
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          this.cursos = response.cursos;
          this.cursos.sort((a, b) =>
            a.nombre.charAt(0) > b.nombre.charAt(0)
              ? 1
              : b.nombre.charAt(0) > a.nombre.charAt(0)
              ? -1
              : 0
          );
        });
    }
  }

  obtenerTrimestreActual() {
    let fechas = this.servicioAutenticacion.getFechasCicloLectivo();
    let fechaInicioPrimerTrimestre = new Date(
      fechas.fechaInicioPrimerTrimestre
    );
    let fechaFinPrimerTrimestre = new Date(fechas.fechaFinPrimerTrimestre);
    let fechaInicioSegundoTrimestre = new Date(
      fechas.fechaInicioSegundoTrimestre
    );
    let fechaFinSegundoTrimestre = new Date(fechas.fechaFinSegundoTrimestre);
    let fechaInicioTercerTrimestre = new Date(
      fechas.fechaInicioTercerTrimestre
    );
    let fechaFinTercerTrimestre = new Date(fechas.fechaFinTercerTrimestre);

    if (
      this.fechaActual.getTime() >= fechaInicioPrimerTrimestre.getTime() &&
      this.fechaActual.getTime() <= fechaFinPrimerTrimestre.getTime()
    ) {
      this.trimestreActual = "1";
    } else if (
      this.fechaActual.getTime() >= fechaInicioSegundoTrimestre.getTime() &&
      this.fechaActual.getTime() <= fechaFinSegundoTrimestre.getTime()
    ) {
      this.trimestreActual = "2";
    } else if (
      this.fechaActual.getTime() >= fechaInicioTercerTrimestre.getTime() &&
      this.fechaActual.getTime() <= fechaFinTercerTrimestre.getTime()
    ) {
      this.trimestreActual = "3";
    } else {
      this.trimestreSeleccionado = "3";
      this.puedeEditarCalificaciones = false;
      return;
    }
    this.trimestreSeleccionado = this.trimestreActual;
    this.puedeEditarCalificaciones = true;
  }

  onTrimestreChange(form: NgForm) {
    this.obtenerNotas(form);
    if (this.trimestreSeleccionado == this.trimestreActual) {
      this.puedeEditarCalificaciones = true;
    } else {
      this.puedeEditarCalificaciones = false;
    }
  }

  //Se obtienen las materias del curso seleccionado segun el docente logueado o todas si el rol logueado es Admin
  onCursoSeleccionado(curso, materia: NgModel) {
    this.cursoSeleccionado = true;
    this.materiaSeleccionada = false;
    this.estudiantes = [];
    this.materias = null;
    materia.reset();
    if (
      this.rolConPermisosEdicion &&
      this.servicioAutenticacion.getRol() != "Admin"
    ) {
      this.servicioEstudiante
        .obtenerMateriasXCursoXDocente(curso.value, this.idDocente)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.materias = respuesta.materias;
          this.materias.sort((a, b) =>
            a.nombre > b.nombre ? 1 : b.nombre > a.nombre ? -1 : 0
          );
        });
    } else {
      this.servicioEstudiante
        .obtenerMateriasDeCurso(curso.value)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.materias = respuesta.materias;
          this.materias.sort((a, b) =>
            a.nombre > b.nombre ? 1 : b.nombre > a.nombre ? -1 : 0
          );
        });
    }
  }

  onValidarCambios() {
    if (
      (this.servicioCalificaciones.auxCambios && this.comboCurso.panelOpen) ||
      (this.servicioCalificaciones.auxCambios && this.comboTrimestre.panelOpen)
    ) {
      const dialogRef = this.popup.open(CalificacionesEstudiantePopupComponent);
      dialogRef.afterClosed().subscribe(() => {
        if (this.servicioCalificaciones.avisoResult) {
          this.servicioCalificaciones.avisoResult = false;
        } else {
          this.comboCurso.close();
          this.comboTrimestre.close();
        }
      });
    }
  }

  obtenerNotas(form: NgForm) {
    this.isLoading2 = true;
    if (form.value.curso != null && form.value.materia != null) {
      this.calificacionesChange = false;
      this.servicioCalificaciones
        .obtenerCalificacionesEstudiantesXCursoXMateria(
          form.value.curso,
          form.value.materia,
          form.value.trimestre
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.materiaSeleccionada = true;
          this.estudiantes = [...respuesta.estudiantes];
          this.estudiantes = this.estudiantes.sort((a, b) =>
            a.apellido > b.apellido ? 1 : b.apellido > a.apellido ? -1 : 0
          );
          this.dataSource = new MatTableDataSource(this.estudiantes);
          this.dataSource.filter = this.filtroEstudiante;
          this.dataSource.paginator = this.paginator;
          this.dataSource.paginator.firstPage();
          this.isLoading2 = false;
        });
    }
  }
  //Recibe la palabra que escribe el usuario y filtra tabla de html
  aplicarFiltro(valorFiltro: string) {
    valorFiltro = valorFiltro.trim();
    valorFiltro = valorFiltro.toLowerCase();
    this.dataSource.filter = valorFiltro;
  }

  indexEstudiante() {
    this.indexEst = this.paginator.pageIndex * this.paginator.pageSize;
  }

  calcularPromedio(index, cantidad) {
    if (cantidad != 0) {
      var notas: number = 0;
      this.dataSource.filteredData[index].calificaciones.forEach((nota) => {
        if (nota != 0 && nota != null) notas = notas + nota;
      });
      this.promedio = notas / cantidad;
    } else this.promedio = 0;
    return this.promedio;
  }

  onCalificacionChange() {
    this.calificacionesChange = true;
  }

  onGuardar(form: NgForm) {
    if (form.invalid) {
      if (form.value.curso == "" || form.value.materia == "") {
        this.snackBar.open("Faltan campos por seleccionar", "", {
          panelClass: ["snack-bar-fracaso"],
          duration: 3000,
        });
      } else {
        this.snackBar.open(
          "Las calificaciones sólo pueden ser números entre 1 y 10.",
          "",
          {
            panelClass: ["snack-bar-fracaso"],
            duration: 3000,
          }
        );
      }
    } else if (form.valueChanges) {
      this.servicioCalificaciones
        .registrarCalificaciones(
          this.estudiantes,
          form.value.materia,
          form.value.trimestre
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          if (respuesta.exito) {
            this.snackBar.open(respuesta.message, "", {
              panelClass: ["snack-bar-exito"],
              duration: 3000,
            });
          }
        });
      this.servicioCalificaciones.auxCambios = false;
    }
  }

  contadorNotasValidas(index): number {
    var cont = 0;
    this.estudiantes[index].calificaciones.forEach((nota) => {
      if (nota != 0 && nota != null) cont++;
    });
    return cont;
  }

  onCancelar() {
    this.popup.open(CancelPopupComponent);
  }

  checkNotas(event, cal) {
    var inputValue = event.which;
    concat = String.fromCharCode(inputValue);
    if (cal != 0) var concat = cal + String.fromCharCode(inputValue);
    if (cal == 0) var concat = String.fromCharCode(inputValue) + cal;
    if (
      !(inputValue >= 48 && inputValue <= 57) &&
      inputValue != 32 &&
      inputValue != 0
    )
      event.preventDefault();
    else if (cal != 0 && Number(concat) > 10) event.preventDefault();
    else if (cal == 0 && Number(concat) > 10) event.preventDefault();
    else this.servicioCalificaciones.auxCambios = true;
  }

  deshabilitarFlechas(event) {
    var inputValue = event.which;
    if (
      inputValue == 37 ||
      inputValue == 38 ||
      inputValue == 39 ||
      inputValue == 40
    ) {
      event.stopPropagation();
      event.preventDefault();
    }
  }
}

export class PaginatorOverviewExample {}

export function getDutchPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = "Items por página";
  paginatorIntl.nextPageLabel = "Página siguiente";
  paginatorIntl.previousPageLabel = "Página anterior";
  return paginatorIntl;
}

@Component({
  selector: "app-calificaciones-estudiantes-popup",
  templateUrl: "./calificaciones-estudiantes-popup.component.html",
  styleUrls: ["./calificaciones-estudiantes.component.css"],
})
export class CalificacionesEstudiantePopupComponent {
  constructor(
    public dialogRef: MatDialogRef<CalificacionesEstudiantePopupComponent>,
    public calificacionesServicio: CalificacionesService
  ) {}

  onYesClick(): void {
    this.calificacionesServicio.auxCambios = false;
    this.calificacionesServicio.avisoResult = true;
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.calificacionesServicio.auxCambios = true;
    this.calificacionesServicio.avisoResult = false;
    this.dialogRef.close();
  }
}
