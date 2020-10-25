import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CalificacionesService } from "src/app/calificaciones/calificaciones.service";
import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { ReportesService } from "../reportes.service";
import { NgForm, NgModel } from "@angular/forms";
import { MatTableDataSource } from "@angular/material";
import { Label } from "ng2-charts";
import { ChartOptions, ChartType } from "chart.js";
import * as pluginDataLabels from "chartjs-plugin-datalabels";

@Component({
  selector: "app-rendimiento-curso",
  templateUrl: "./rendimiento-curso.component.html",
  styleUrls: ["./rendimiento-curso.component.css"],
})
export class RendimientoCursoComponent implements OnInit {
  year: any[] = [];
  cursos;
  fechaActual: Date;
  rolConPermisosEdicion = false;
  cursoNotSelected = true;
  isLoading = false;
  materias: any[] = [];
  materiaSelec: boolean;
  estudiantes: any = [];
  docente: any;
  dataSource: MatTableDataSource<any>;
  isLoading2 = false;
  promedioT1: any = [];
  promedioT2: any = [];
  promedioT3: any = [];
  promedio: any = [];
  isLoading3 = true;
  //Intervalos
  t1_iMI3 = 0;
  t1_iE3Y6 = 0;
  t1_iE6y8 = 0;
  t1_iM8 = 0;
  t2_iMI3 = 0;
  t2_iE3Y6 = 0;
  t2_iE6y8 = 0;
  t2_iM8 = 0;
  t3_iMI3 = 0;
  t3_iE3Y6 = 0;
  t3_iE6y8 = 0;
  t3_iM8 = 0;
  //
  private unsubscribe: Subject<void> = new Subject();
  barChartLabels: Label[] = [];
  public barChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      labels: {
        fontSize: 18,
      },
    },
    plugins: {
      datalabels: {
        font: {
          size: 20,
          weight: "bold",
        },
      },
    },
  };
  barDataSet = [];

  public barChartType: ChartType = "pie";
  public barChartPlugins = [pluginDataLabels];
  public barChartLegend;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public reportService: ReportesService,
    public servicioCalificaciones: CalificacionesService,
    public servicioCicloLectivo: CicloLectivoService,
    public servicioEstudianteAutenticacion: AutenticacionService
  ) {}

  ngOnInit(): void {
    this.fechaActual = new Date();
    this.servicioCicloLectivo
      .obtenerAniosCicloLectivo()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.year = response.respuesta;
        this.year.sort((a, b) =>
          a.anio > b.anio ? 1 : b.anio > a.anio ? -1 : 0
        );
      });
  }

  onYearSelected(yearSelected) {
    this.materiaSelec = false;
    this.estudiantes = [];
    this.materias = [];
    this.obtenerCursos(yearSelected.value);
  }

  obtenerCursos(yearS) {
    if (this.servicioEstudianteAutenticacion.getRol() == "Docente") {
      this.servicioEstudianteAutenticacion
        .obtenerIdEmpleado(this.servicioEstudianteAutenticacion.getId())
        .subscribe((response) => {
          this.docente = response.id;
          this.servicioEstudiante
            .obtenerCursosDeDocentePorCiclo(this.docente, yearS)
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
        .obtenerCursos(yearS)
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

  onCursoSeleccionado(curso, materia: NgModel) {
    this.materiaSelec = false;
    this.estudiantes = [];
    this.materias = [];
    materia.reset();
    if (
      this.rolConPermisosEdicion &&
      this.servicioEstudianteAutenticacion.getRol() != "Admin" &&
      this.servicioEstudianteAutenticacion.getRol() != "Director"
    ) {
      this.servicioEstudiante
        .obtenerMateriasXCursoXDocente(curso.value, this.docente)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.materias = respuesta.materias.sort((a, b) =>
            a.nombre > b.nombre ? 1 : b.nombre > a.nombre ? -1 : 0
          );
        });
    } else {
      this.servicioEstudiante
        .obtenerMateriasDeCurso(curso.value)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.materias = respuesta.materias.sort((a, b) =>
            a.nombre > b.nombre ? 1 : b.nombre > a.nombre ? -1 : 0
          );
        });
    }
  }

  obtenerNotas(form: NgForm) {
    this.isLoading2 = true;
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
          this.calcularPromedio();
          this.dataSource = new MatTableDataSource(this.estudiantes);
          this.isLoading2 = false;
          this.diferenciarIntervalos();
        });
    }
    this.materiaSelec = true;
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

  calcularPromedio() {
    for (let index = 0; index < this.estudiantes.length; index++) {
      var notas: number = 0;
      var cont: number = 0;
      this.estudiantes[index].calificaciones[0][0].forEach((nota) => {
        if (nota != 0 && nota != null) {
          notas = notas + nota;
          cont++;
        }
      });
      if (cont != 0) this.promedioT1[index] = notas / cont;
      else this.promedioT1[index] = 0;
      notas = 0;
      cont = 0;
      this.estudiantes[index].calificaciones[1][0].forEach((nota) => {
        if (nota != 0 && nota != null) {
          notas = notas + nota;
          cont++;
        }
      });
      if (cont != 0) this.promedioT2[index] = notas / cont;
      else this.promedioT2[index] = 0;
      notas = 0;
      cont = 0;
      this.estudiantes[index].calificaciones[2][0].forEach((nota) => {
        if (nota != 0 && nota != null) {
          notas = notas + nota;
          cont++;
        }
      });
      if (cont != 0) this.promedioT3[index] = notas / cont;
      else this.promedioT3[index] = 0;

      if (
        this.promedioT1[index] != 0 &&
        this.promedioT2[index] != 0 &&
        this.promedioT3[index] != 0
      )
        this.promedio[index] =
          (this.promedioT1[index] +
            this.promedioT2[index] +
            this.promedioT3[index]) /
          3;
      else if (this.promedioT1[index] != 0 && this.promedioT2[index] != 0)
        this.promedio[index] =
          (this.promedioT1[index] + this.promedioT2[index]) / 2;
      else this.promedio[index] = this.promedioT1[index];
    }
  }

  diferenciarIntervalos() {
    this.isLoading3 = true;
    this.resetearContadoresIntervalo();
    for (let index = 0; index < this.promedioT1.length; index++) {
      switch (true) {
        case this.promedioT1[index] <= 3:
          this.t1_iMI3++;
          break;
        case this.promedioT1[index] > 3 && this.promedioT1[index] < 6:
          this.t1_iE3Y6++;
          break;
        case this.promedioT1[index] >= 6 && this.promedioT1[index] <= 8:
          this.t1_iE6y8++;
          break;
        case this.promedioT1[index] > 8:
          this.t1_iM8++;
          break;
        default:
          break;
      }
    }
    for (let index = 0; index < this.promedioT2.length; index++) {
      switch (true) {
        case this.promedioT2[index] <= 3:
          this.t2_iMI3++;
          break;
        case this.promedioT2[index] > 3 && this.promedioT2[index] < 6:
          this.t2_iE3Y6++;
          break;
        case this.promedioT2[index] >= 6 && this.promedioT2[index] <= 8:
          this.t2_iE6y8++;
          break;
        case this.promedioT2[index] > 8:
          this.t2_iM8++;
          break;
        default:
          break;
      }
    }
    for (let index = 0; index < this.promedioT3.length; index++) {
      switch (true) {
        case this.promedioT3[index] <= 3:
          this.t3_iMI3++;
          break;
        case this.promedioT3[index] > 3 && this.promedioT3[index] < 6:
          this.t3_iE3Y6++;
          break;
        case this.promedioT3[index] >= 6 && this.promedioT3[index] <= 8:
          this.t3_iE6y8++;
          break;
        case this.promedioT3[index] > 8:
          this.t3_iM8++;
          break;
        default:
          break;
      }
    }
    this.isLoading3 = false;
    this.barDataSet = [
      {
        backgroundColor: ["#f67575", "#ffa34d", "#d4f8e8", "1eb2a6"],
        data: [this.t1_iMI3, this.t1_iE3Y6, this.t1_iE6y8, this.t1_iM8],
      },
    ];

    this.barChartLabels = [
      "Menor igual a 3",
      "Entre 3 y 6",
      "Entre 6 y 8 inc",
      "Mayor a 8",
    ];
  }

  resetearContadoresIntervalo() {
    this.t1_iMI3 = 0;
    this.t1_iE3Y6 = 0;
    this.t1_iE6y8 = 0;
    this.t1_iM8 = 0;
    this.t2_iMI3 = 0;
    this.t2_iE3Y6 = 0;
    this.t2_iE6y8 = 0;
    this.t2_iM8 = 0;
    this.t3_iMI3 = 0;
    this.t3_iE3Y6 = 0;
    this.t3_iE6y8 = 0;
    this.t3_iM8 = 0;
  }
}
