import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { AutenticacionService } from "../../login/autenticacionService.service";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { MatDialog } from "@angular/material";
import { NgForm, NgModel } from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { CalificacionesService } from "../calificaciones.service";
import { MatPaginatorIntl } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { MediaMatcher } from "@angular/cdk/layout";
import { Router } from "@angular/router";

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
    "examen",
  ];
  rolConPermisosEdicion = false;
  isLoading = false;
  calificacionesChange = false;
  puedeEditarCalificaciones = false;
  docenteNoTieneCursos = false;
  examen;
  promedio = 0;
  promedioT1 = 0;
  promedioT2 = 0;
  promedioT3 = 0;
  dataSource: MatTableDataSource<any>;
  indexEst = 0;
  private unsubscribe: Subject<void> = new Subject();
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  materiaSelec: boolean = false;
  docente: string;
  anosCiclos: any[];

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioCalificaciones: CalificacionesService,
    public servicioCicloLectivo: CicloLectivoService,
    public popup: MatDialog,
    public servicioEstudianteAutenticacion: AutenticacionService,
    public changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 880px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.isLoading = true;
    this.servicioCicloLectivo
      .obtenerActualYAnteriores()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.anosCiclos = response.añosCiclos;
        this.anosCiclos.sort(function (a, b) {
          return b - a;
        });
      });
    this.validarPermisos();
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

  obtenerCursos(yearS) {
    this.isLoading = true;
    if (this.servicioEstudianteAutenticacion.getRol() == "Docente") {
      this.servicioEstudianteAutenticacion
        .obtenerIdEmpleado(this.servicioEstudianteAutenticacion.getId())
        .subscribe((response) => {
          this.docente = response.id;
          this.servicioEstudiante
            .obtenerCursosDeDocentePorCiclo(this.docente, yearS)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((response) => {
              this.isLoading = false;  
                       
              if( response.cursos.length==0){
                this.docenteNoTieneCursos=true;
              }else{
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
              }
            });
        });
    } else {
      this.servicioEstudiante
        .obtenerCursos(yearS)
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
  }
  onYearSelected(yearSelected) {
    this.docenteNoTieneCursos=false
    this.materiaSelec = false;
    this.estudiantes = [];
    this.materias = [];
    this.obtenerCursos(yearSelected.value);
  }

  onCursoSeleccionado(curso, materia: NgModel) {
    this.materiaSelec = false;
    this.estudiantes = [];
    this.materias = [];
    materia.reset();
    this.isLoading = true;
    if (
      this.rolConPermisosEdicion &&
      this.servicioEstudianteAutenticacion.getRol() != "Admin" &&
      this.servicioEstudianteAutenticacion.getRol() != "Director"
    ) {
      this.servicioEstudiante
        .obtenerMateriasXCursoXDocente(curso.value, this.docente)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.isLoading = false;
          this.materias = respuesta.materias.sort((a, b) =>
            a.nombre > b.nombre ? 1 : b.nombre > a.nombre ? -1 : 0
          );
        });
    } else {
      this.servicioEstudiante
        .obtenerMateriasDeCurso(curso.value)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.isLoading = false;
          this.materias = respuesta.materias.sort((a, b) =>
            a.nombre > b.nombre ? 1 : b.nombre > a.nombre ? -1 : 0
          );
        });
    }
  }

  obtenerNotas(form: NgForm) {
    this.isLoading = true;
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
            a.apellido.toLowerCase() > b.apellido.toLowerCase()
              ? 1
              : b.apellido.toLowerCase() > a.apellido.toLowerCase()
              ? -1
              : 0
          );
          this.reordenarCalificaciones();
          this.dataSource = new MatTableDataSource(this.estudiantes);
          this.dataSource.paginator = this.paginator;
          this.dataSource.paginator.firstPage();
          this.isLoading = false;
        });
    }
    this.materiaSelec = true;
  }

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

  calcularPromedio(index) {
    var notas: number = 0;
    var cont: number = 0;

    if (this.estudiantes[index].promedio[0].length != 0) {
      this.examen = parseFloat(this.estudiantes[index].promedio[0]);
    } else {
      this.examen = 0;
    }

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

    if (this.promedio == this.examen || this.examen==0) this.examen = "-";

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
    this.router.navigate(["./home"]);
  }
}

export class PaginatorOverviewExample {}

export function getDutchPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = "Estudiantes por página";
  paginatorIntl.nextPageLabel = "Página siguiente";
  paginatorIntl.previousPageLabel = "Página anterior";
  return paginatorIntl;
}
