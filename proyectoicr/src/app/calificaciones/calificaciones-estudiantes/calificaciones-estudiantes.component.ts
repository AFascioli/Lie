import { CancelPopupComponent } from "src/app/popup-genericos/cancel-popup.component";
import { AutenticacionService } from "../../login/autenticacionService.service";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { MatDialog, MatSnackBar } from "@angular/material";
import { NgForm, NgModel } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { CalificacionesService } from "../calificaciones.service";
import { MatPaginatorIntl } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { MediaMatcher } from '@angular/cdk/layout';

@Component({
  selector: "app-calificaciones-estudiantes",
  templateUrl: "./calificaciones-estudiantes.component.html",
  styleUrls: ["./calificaciones-estudiantes.component.css"]
})
export class CalificacionesEstudiantesComponent implements OnInit, OnDestroy {
  cursos: any[];
  materias: any[];
  estudiantes: any[];
  displayedColumns: string[] = [
    "apellido",
    "nombre",
    "cal1",
    "cal2",
    "cal3",
    "cal4",
    "cal5",
    "cal6",
    "prom"
  ];
  trimestreSeleccionado: string;
  trimestreActual: string = "fuera";
  rolConPermisosEdicion = false;
  isLoading = true;
  fechaActual: Date;
  calificacionesChange = false;
  puedeEditarCalificaciones = false;
  promedio = 0;
  dataSource: MatTableDataSource<any>;
  indexEst = 0;
  cursoSeleccionado: boolean=false;
  private unsubscribe: Subject<void> = new Subject();
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioCalificaciones: CalificacionesService,
    public popup: MatDialog,
    private snackBar: MatSnackBar,
    public servicioEstudianteAutenticacion: AutenticacionService,
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
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  validarPermisos() {
    this.servicioEstudianteAutenticacion
      .obtenerPermisosDeRol()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(res => {
        if (res.permisos.notas == 2) {
          this.rolConPermisosEdicion = true;
        }
        this.isLoading = false;
      });
  }

  obtenerCursos() {
    if (this.servicioEstudianteAutenticacion.getRol() == "Docente") {
      this.servicioEstudiante
        .obtenerCursosDeDocente(this.servicioEstudianteAutenticacion.getId())
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
    } else {
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

  obtenerTrimestreActual() {
    let fechas = this.servicioEstudianteAutenticacion.getFechasCicloLectivo();
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

  // applyFilter(filterValue: string) {
  //   filterValue = filterValue.trim(); // Remove whitespace
  //   filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
  //   //ACA CREO Q ESTA EL PROBLEMA
  //   this.dataSource = new MatTableDataSource(this.servicioEstudiante.estudiantes);
  //   this.dataSource.filter = filterValue;
  // }

  onCursoSeleccionado(curso, materia: NgModel) {
    this.cursoSeleccionado=true;
    this.estudiantes = null;
    this.materias = null;
    materia.reset();
    if (
      this.rolConPermisosEdicion &&
      this.servicioEstudianteAutenticacion.getRol() != "Admin"
    ) {
      this.servicioEstudiante
        .obtenerMateriasXCursoXDocente(
          curso.value,
          this.servicioEstudianteAutenticacion.getId()
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(respuesta => {
          this.materias = respuesta.materias;
        });
    } else {
      this.servicioEstudiante
        .obtenerMateriasDeCurso(curso.value)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(respuesta => {
          this.materias = respuesta.materias;
        });
    }
  }

  obtenerNotas(form: NgForm) {
    // Revisar condicion por si las dudas #resolve
    if (form.value.curso != null && form.value.materia != null) {
      this.servicioCalificaciones
        .obtenerCalificacionesEstudiantesXCursoXMateria(
          form.value.curso,
          form.value.materia,
          form.value.trimestre
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(respuesta => {
          this.estudiantes = [...respuesta.estudiantes];
          console.log(this.estudiantes);
          this.estudiantes = this.estudiantes.sort((a, b) =>
            a.apellido > b.apellido ? 1 : b.apellido > a.apellido ? -1 : 0
          );
          this.dataSource = new MatTableDataSource(this.estudiantes);
          this.dataSource.paginator = this.paginator;
          this.dataSource.paginator.firstPage();
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
      this.estudiantes[index].calificaciones.forEach(nota => {
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
          duration: 3000
        });
      } else {
        this.snackBar.open(
          "Las calificaciones sólo pueden ser números entre 1 y 10.",
          "",
          {
            panelClass: ["snack-bar-fracaso"],
            duration: 3000
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
        .subscribe(respuesta => {
          if (respuesta.exito) {
            this.snackBar.open(respuesta.message, "", {
              panelClass: ["snack-bar-exito"],
              duration: 3000
            });
          }
        });
    }
  }

  contadorNotasValidas(index): number {
    var cont = 0;
    this.estudiantes[index].calificaciones.forEach(nota => {
      if (nota != 0 && nota != null) cont++;
    });
    return cont;
  }

  onCancelar() {
    this.popup.open(CancelPopupComponent);
  }

  checkNotas(event, cal) {
    var inputValue = event.which;
    var concat = cal + String.fromCharCode(inputValue);
    if (
      !(inputValue >= 48 && inputValue <= 57) &&
      inputValue != 32 &&
      inputValue != 0
    )
      event.preventDefault();
    else if (cal != "" && Number(concat) > 10) event.preventDefault();
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
