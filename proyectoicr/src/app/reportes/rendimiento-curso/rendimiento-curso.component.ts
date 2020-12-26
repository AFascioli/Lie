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

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

@Component({
  selector: "app-rendimiento-curso",
  templateUrl: "./rendimiento-curso.component.html",
  styleUrls: ["./rendimiento-curso.component.css"],
})
export class RendimientoCursoComponent implements OnInit {
  cursos;
  cursoS;
  cursoSNombre;
  cursoNotSelected = true;

  materiaS;
  materiaSNombre;
  materias: any[] = [];
  materiaSelec: boolean;

  idDocente;

  year: any[] = [];
  fechaActual: any;

  rolConPermisosEdicion = false;

  isLoading2 = false;
  isLoading3 = true;

  estudiantes: any = [];

  dataSource: MatTableDataSource<any>;

  promedioT1: any = [];
  promedioT2: any = [];
  promedioT3: any = [];
  promedio: any = [];

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
  f_iMI3 = 0;
  f_iE3Y6 = 0;
  f_iE6y8 = 0;
  f_iM8 = 0;

  tipoGrafico;

  barChartLabels: Label[] = [];
  barChartLabelsH: Label[] = [];
  barDataSet = [];
  barDataSet1 = [];
  barDataSet2 = [];
  barDataSet3 = [];
  legend: boolean = false;
  public barChartOptions: ChartOptions;
  public barChartOptions1: ChartOptions;
  public barChartOptions2: ChartOptions;
  public barChartOptions3: ChartOptions;
  public barChartType: ChartType;
  public barChartPlugins = [pluginDataLabels];
  public barChartLegend;

  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public servicioEstudiante: EstudiantesService,
    public reportService: ReportesService,
    public servicioCalificaciones: CalificacionesService,
    public servicioCicloLectivo: CicloLectivoService,
    public servicioAutenticacion: AutenticacionService
  ) {}

  ngOnInit(): void {
    this.fechaActual = new Date().getFullYear();
    this.onTipoGraficoChange(0);
  }

  onYearSelected(yearSelected) {
    this.materiaSelec = false;
    this.materiaS=null;
    this.estudiantes = [];
    this.materias = [];
    this.obtenerCursos(yearSelected.value);
  }

  obtenerCursos(yearS) {
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

  onCursoSeleccionado(curso, materia) {
    this.cursoS = curso;
    this.cursoSNombre = this.obtenerNombreCurso(curso.value);
    this.materiaS = materia;
    this.materiaSelec = false;
    this.estudiantes = [];
    this.materias = [];
    materia.reset();
    if (this.servicioAutenticacion.getRol() != "Docente") {
      this.servicioEstudiante
        .obtenerMateriasDeCurso(curso.value)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.materias = respuesta.materias;
          this.materias.sort((a, b) =>
            a.nombre > b.nombre ? 1 : b.nombre > a.nombre ? -1 : 0
          );
        });
    } else {
      this.servicioEstudiante
        .obtenerMateriasXCursoXDocente(curso.value, this.idDocente)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((respuesta) => {
          this.materias = respuesta.materias;
          this.materias.sort((a, b) =>
            a.nombre > b.nombre ? 1 : b.nombre > a.nombre ? -1 : 0
          );
        });
    }
  }

  obtenerNotas(materia) {
    this.materiaSNombre = this.obtenerNombreMateria(materia);
    this.isLoading2 = true;
    if (this.cursoS.value != "" || materia != "") {
      this.servicioCalificaciones
        .obtenerCalificacionesEstudiantesXCursoXMateriaCicloLectivo(
          this.cursoS.value,
          materia
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
    for (let index = 0; index < this.promedio.length; index++) {
      switch (true) {
        case this.promedio[index] <= 3:
          this.f_iMI3++;
          break;
        case this.promedio[index] > 3 && this.promedio[index] < 6:
          this.f_iE3Y6++;
          break;
        case this.promedio[index] >= 6 && this.promedio[index] <= 8:
          this.f_iE6y8++;
          break;
        case this.promedio[index] > 8:
          this.f_iM8++;
          break;
        default:
          break;
      }
    }
    this.configuracionGraficos();
  }

  obtenerNombreCurso(idCurso) {
    for (let index = 0; index < this.cursos.length; index++) {
      if (this.cursos[index].id == idCurso) {
        return this.cursos[index].nombre;
      }
    }
  }

  obtenerNombreMateria(idMateria) {
    for (let index = 0; index < this.materias.length; index++) {
      if (this.materias[index].id == idMateria) {
        return this.materias[index].nombre;
      }
    }
  }

  onTipoGraficoChange(grafico) {
    this.isLoading3 = true;
    switch (grafico) {
      case 0:
        grafico = "pie";
        break;
      case 1:
        grafico = "doughnut";
        break;
      case 2:
        grafico = "bar";
        break;
      case 3:
        grafico = "horizontalBar";
        break;
      default:
        break;
    }
    this.barChartType = grafico;
    this.tipoGrafico = grafico;
    if (grafico == "pie" || grafico == "doughnut") this.legend = true;
    else this.legend = false;

    if (this.materiaS && (this.materiaS.value!="" && this.materiaS.value!=null)) this.obtenerNotas(this.materiaS.value);
    else if (this.cursoS) this.onCursoSeleccionado(this.cursoS, this.materiaS);
    else
      this.servicioCicloLectivo
        .obtenerActualYAnteriores()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          this.year = response.añosCiclos;
        });
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
    this.f_iMI3 = 0;
    this.f_iE3Y6 = 0;
    this.f_iE6y8 = 0;
    this.f_iM8 = 0;
  }

  configuracionGraficos() {
    this.barChartType = this.tipoGrafico;
    this.isLoading3 = false;
    this.barDataSet = [
      {
        backgroundColor: ["#6a8caf", "#75b79e", "#a7e9af", "#eef9bf"],
        // backgroundColor: ["#dddddd", "#d9adad", "#84a9ac", "#89c9b8"],
        // backgroundColor: ["#ea907a", "#fbc687", "#f4f7c5", "#aacdbe"],
        data: [this.t1_iMI3, this.t1_iE3Y6, this.t1_iE6y8, this.t1_iM8],
      },
    ];
    this.barDataSet1 = [
      {
        backgroundColor: ["#6a8caf", "#75b79e", "#a7e9af", "#eef9bf"],
        data: [this.t2_iMI3, this.t2_iE3Y6, this.t2_iE6y8, this.t2_iM8],
      },
    ];
    this.barDataSet2 = [
      {
        backgroundColor: ["#6a8caf", "#75b79e", "#a7e9af", "#eef9bf"],
        data: [this.t3_iMI3, this.t3_iE3Y6, this.t3_iE6y8, this.t3_iM8],
      },
    ];
    this.barDataSet3 = [
      {
        backgroundColor: ["#6a8caf", "#75b79e", "#a7e9af", "#eef9bf"],
        data: [this.f_iMI3, this.f_iE3Y6, this.f_iE6y8, this.f_iM8],
      },
    ];

    // this.barChartLabels = [
    //   "Promedio menor o igual a 3",
    //   "Promedio entre 3 y 6 inclusive",
    //   "Promedio entre 6 y 8 inclusive",
    //   "Promedio mayor a 8",
    // ];
    this.barChartLabelsH = [
      "Promedio <= 3",
      "3 < Promedio <= 6",
      "6 < Promedio <= 8",
      "Promedio > 8",
    ];

    this.barChartOptions = {
      responsive: false,
      legend: {
        display: this.legend,
        labels: {
          boxWidth: 20,
          fontSize: 12,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
          fontColor: "#181a21",
        },
        position: "right",
      },
      plugins: {
        datalabels: {
          font: {
            size: 14,
            weight: "bold",
            family:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
          },
        },
      },
      title: {
        display: true,
        text: "Trimestre 1",
        fontSize: 16,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        fontColor: "#181a21",
      },
    };
    this.barChartOptions1 = {
      responsive: false,
      legend: {
        display: this.legend,
        labels: {
          boxWidth: 20,
          fontSize: 12,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
          fontColor: "#181a21",
        },
        position: "right",
      },
      plugins: {
        datalabels: {
          font: {
            size: 14,
            weight: "bold",
            family:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
          },
        },
      },
      title: {
        display: true,
        text: "Trimestre 2",
        fontSize: 16,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        fontColor: "#181a21",
      },
    };
    this.barChartOptions2 = {
      responsive: false,
      legend: {
        display: this.legend,
        labels: {
          boxWidth: 20,
          fontSize: 12,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
          fontColor: "#181a21",
        },
        position: "right",
      },
      plugins: {
        datalabels: {
          font: {
            size: 14,
            weight: "bold",
            family:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
          },
        },
      },
      title: {
        display: true,
        text: "Trimestre 3",
        fontSize: 16,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        fontColor: "#181a21",
      },
    };
    this.barChartOptions3 = {
      responsive: true,
      legend: {
        display: this.legend,
        labels: {
          boxWidth: 20,
          fontSize: 14,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
          fontColor: "#181a21",
        },
        position: "bottom",
      },
      plugins: {
        datalabels: {
          font: {
            size: 14,
            weight: "bold",
            family:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
          },
        },
      },
      title: {
        display: true,
        text: "General",
        fontSize: 16,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        fontColor: "#181a21",
      },
    };
  }

  public descargarPDF() {
    var element = document.getElementById("content");

    const o_date = new Intl.DateTimeFormat();
    const f_date = (m_ca, m_it) => Object({ ...m_ca, [m_it.type]: m_it.value });
    const m_date = o_date.formatToParts().reduce(f_date, {});

    html2canvas(element).then((canvas) => {
      var imgData = canvas.toDataURL("image/png");
      var doc = new jsPDF();
      var imgH = (canvas.height * 208) / canvas.width;
      var imgICR = new Image();
      imgICR.src = "assets/reports/logoICR.png";
      var imgLIE = new Image();
      imgLIE.src = "assets/reports/logoLIE.png";
      doc.addImage(imgICR, 10, 2, 15, 15);
      doc.addImage(imgLIE, 190, 4, 10, 10);
      doc.setTextColor(156, 156, 156);
      doc.setFontSize(10);
      doc.setFont("Segoe UI");
      doc.text("Instituto Cristo Rey", 94, 7);
      doc.text("Ciclo lectivo " + this.fechaActual, 95, 12);
      doc.setDrawColor(184, 184, 184);
      doc.line(10, 17, 200, 17);
      doc.addImage(imgData, 0, 30, 208, imgH);
      doc.text(
        "Fecha: " + m_date.day + "/" + m_date.month + "/" + m_date.year,
        10,
        295 - 5
      );
      doc.text("Página: 1", 180, 295 - 5);
      doc.save(
        "RendimientoCurso-" +
          this.cursoSNombre +
          "-" +
          this.materiaSNombre +
          ".pdf"
      );
    });
  }
}
