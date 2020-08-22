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
import { MatDialog, MatSnackBar } from "@angular/material";
import { NgForm, NgModel } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { CalificacionesService } from "../calificaciones.service";
import { MatPaginatorIntl } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
  selector: "app-calificaciones-ciclo-lectivo",
  templateUrl: "./calificaciones-ciclo-lectivo.component.html",
  styleUrls: ["./calificaciones-ciclo-lectivo.component.css"],
})
export class CalificacionesCicloLectivoComponent implements OnInit, OnDestroy {
  cursos: any[] = [];
  materias: any[] = [];
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
    "prom1",
    "cal7",
    "cal8",
    "cal9",
    "cal10",
    "cal11",
    "cal12",
    "prom2",
    "cal13",
    "cal14",
    "cal15",
    "cal16",
    "cal17",
    "cal18",
    "prom3",
    "prom",
  ];
  rolConPermisosEdicion = false;
  isLoading = true;
  fechaActual: Date;
  calificacionesChange = false;
  puedeEditarCalificaciones = false;
  promedio = 0;
  promedioT1 = 0;
  promedioT2 = 0;
  promedioT3 = 0;
  dataSource: MatTableDataSource<any>;
  indexEst = 0;
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
      .subscribe((res) => {
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

  // applyFilter(filterValue: string) {
  //   filterValue = filterValue.trim(); // Remove whitespace
  //   filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
  //   //ACA CREO Q ESTA EL PROBLEMA
  //   this.dataSource = new MatTableDataSource(this.servicioEstudiante.estudiantes);
  //   this.dataSource.filter = filterValue;
  // }

  onCursoSeleccionado(curso, materia: NgModel) {
    this.estudiantes = [];
    this.materias = [];
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
        .subscribe((respuesta) => {
          this.materias = respuesta.materias;
        });
    } else {
      this.servicioEstudiante
        .obtenerMateriasDeCurso(curso.value)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.materias = respuesta.materias;
        });
    }
  }

  obtenerNotas(form: NgForm) {
    if (form.value.curso != "" || form.value.materia != "") {
      this.servicioCalificaciones
        .obtenerCalificacionesEstudiantesXCursoXMateriaCicloLectivo(
          form.value.curso,
          form.value.materia
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.estudiantes = [...respuesta.estudiantes];
          this.estudiantes = this.estudiantes.sort((a, b) =>
            a.apellido > b.apellido ? 1 : b.apellido > a.apellido ? -1 : 0
          );
          this.reordenarCalificaciones();
          this.dataSource = new MatTableDataSource(this.estudiantes);
          //this.dataSource.paginator = this.paginator;
          //this.dataSource.paginator.firstPage();
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

  reordenarCalificaciones() {
    for (let i = 0; i < this.estudiantes.length; i++) {
      if (this.estudiantes[i].trimestre[0][0] != 1) {
        if (this.estudiantes[i].trimestre[1][0] != 1) {
          if (this.estudiantes[i].trimestre[2][0] == 1) {
            let auxCal = this.estudiantes[i].calificaciones[0];
            let auxTrim = this.estudiantes[i].trimestre[0][0];
            this.estudiantes[i].calificaciones[0] = this.estudiantes[
              i
            ].calificaciones[2];
            this.estudiantes[i].calificaciones[2] = auxCal;
            this.estudiantes[i].trimestre[0][0] = 1;
            this.estudiantes[i].trimestre[2][0] = auxTrim;
            if (this.estudiantes[i].trimestre[1][0] != 2) {
              let auxCal = this.estudiantes[i].calificaciones[1];
              this.estudiantes[i].calificaciones[1] = this.estudiantes[
                i
              ].calificaciones[2];
              this.estudiantes[i].calificaciones[2] = auxCal;
              this.estudiantes[i].trimestre[1][0] = 2;
              this.estudiantes[i].trimestre[2][0] = 3;
            }
          }
        } else {
          let auxCal = this.estudiantes[i].calificaciones[0];
          let auxTrim = this.estudiantes[i].trimestre[0][0];
          this.estudiantes[i].calificaciones[0] = this.estudiantes[
            i
          ].calificaciones[1];
          this.estudiantes[i].calificaciones[1] = auxCal;
          this.estudiantes[i].trimestre[0][0] = 1;
          this.estudiantes[i].trimestre[1][0] = auxTrim;
          if (this.estudiantes[i].trimestre[1][0] != 2) {
            let auxCal = this.estudiantes[i].calificaciones[1];
            this.estudiantes[i].calificaciones[1] = this.estudiantes[
              i
            ].calificaciones[2];
            this.estudiantes[i].calificaciones[2] = auxCal;
            this.estudiantes[i].trimestre[1][0] = 2;
            this.estudiantes[i].trimestre[2][0] = 3;
          }
        }
      } else {
        if (this.estudiantes[i].trimestre[1][0] != 2) {
          let auxCal = this.estudiantes[i].calificaciones[1];
          this.estudiantes[i].calificaciones[1] = this.estudiantes[
            i
          ].calificaciones[2];
          this.estudiantes[i].calificaciones[2] = auxCal;
          this.estudiantes[i].trimestre[1][0] = 2;
          this.estudiantes[i].trimestre[2][0] = 3;
        }
      }
    }
  }

  calcularPromedio(index, cantidad) {
    var notas: number = 0;
    var cont: number = 0;
    this.estudiantes[index].calificaciones[0][0].forEach((nota) => {
      if (nota != 0 && nota != null) {
        notas = notas + nota;
        cont++;
      }
    });
    if (cont != 0) this.promedioT1 = notas / cont;
    else this.promedioT1 = 0;
    notas = 0;
    cont = 0;
    this.estudiantes[index].calificaciones[1][0].forEach((nota) => {
      if (nota != 0 && nota != null) {
        notas = notas + nota;
        cont++;
      }
    });
    if (cont != 0) this.promedioT2 = notas / cont;
    else this.promedioT2 = 0;
    notas = 0;
    cont = 0;
    this.estudiantes[index].calificaciones[2][0].forEach((nota) => {
      if (nota != 0 && nota != null) {
        notas = notas + nota;
        cont++;
      }
    });
    if (cont != 0) this.promedioT3 = notas / cont;
    else this.promedioT3 = 0;

    if (this.promedioT1 != 0 && this.promedioT2 != 0 && this.promedioT3 != 0)
      this.promedio = (this.promedioT1 + this.promedioT2 + this.promedioT3) / 3;
    else if (this.promedioT1 != 0 && this.promedioT2 != 0)
      this.promedio = (this.promedioT1 + this.promedioT2) / 2;
    else this.promedio = this.promedioT1;

    return this.promedio;
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
}

export class PaginatorOverviewExample {}

export function getDutchPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = "Items por página";
  paginatorIntl.nextPageLabel = "Página siguiente";
  paginatorIntl.previousPageLabel = "Página anterior";
  return paginatorIntl;
}
