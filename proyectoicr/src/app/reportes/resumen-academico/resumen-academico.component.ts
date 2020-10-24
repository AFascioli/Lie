import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs/internal/Subject";
import { takeUntil } from "rxjs/operators";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { ReportesService } from "../reportes.service";
import { Router } from "@angular/router";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

@Component({
  selector: "app-resumen-academico",
  templateUrl: "./resumen-academico.component.html",
  styleUrls: ["./resumen-academico.component.css"],
})
export class ResumenAcademicoComponent implements OnInit {
  cursos;
  fechaActual: Date;
  estudiantes: any;
  displayedColumns: string[] = ["apellido", "nombre", "accion"];
  cursoNotSelected = true;
  isLoading = false;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public router: Router,
    public servicioEstudiante: EstudiantesService,
    public reportService: ReportesService
  ) {}

  ngOnInit(): void {
    this.fechaActual = new Date();
    this.obtenerCursos();
  }

  obtenerEstudiantes(curso) {
    this.isLoading = true;
    this.cursoNotSelected = false;
    this.servicioEstudiante
      .obtenerEstudiantesDeCurso(curso.value)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.estudiantes = response.estudiante;
        this.estudiantes.sort((a, b) =>
          a.apellido.charAt(0) > b.apellido.charAt(0)
            ? 1
            : b.apellido.charAt(0) > a.apellido.charAt(0)
            ? -1
            : 0
        );
        this.isLoading = false;
      });
  }

  obtenerCursos() {
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
  verResumenAcademico(i) {
    this.reportService.idEstudianteSeleccionado = i._id;
    this.router.navigate(["reporteResumenAcademico"]);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
@Component({
  selector: "app-reporte-resumen-academico",
  templateUrl: "./reporte-resumen-academico.component.html",
  styleUrls: ["./resumen-academico.component.css"],
})
export class ReporteResumenAcademicoComponent implements OnInit {
  private unsubscribe: Subject<void> = new Subject();
  public idEstudiante = this.reportService.idEstudianteSeleccionado;
  fechaActual: any;
  promedio;
  promedioT1;
  promedioT2;
  promedioT3;
  promedioF = [];
  promedioGeneral = 0;
  resumen: any;
  estudiante: any;
  isLoading = false;
  sanciones;
  inasistenciasInjustificadas;
  inasistenciasJustificadas;
  sumatoriaSanciones = [0, 0, 0, 0];
  displayedColumns: string[] = [
    "materia",
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
  constructor(
    public servicioEstudiante: EstudiantesService,
    public reportService: ReportesService
  ) {}

  ngOnInit(): void {
    this.fechaActual = new Date().getFullYear();
    this.isLoading = true;
    this.reportService
      .obtenerResumenAcademico(this.idEstudiante)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.resumen = response.resumen.sort((a, b) =>
          a.Materia > b.Materia ? 1 : b.Materia > a.Materia ? -1 : 0
        );
        this.sanciones = this.resumen[0].sanciones;
        this.estudiante = this.resumen[0].apellido + " "+ this.resumen[0].nombre;
        this.inasistenciasInjustificadas = this.resumen[0].contadorInasistenciasInjustificada;
        this.inasistenciasJustificadas = this.resumen[0].contadorInasistenciasJustificada;
        this.reordenarCalificaciones();
        this.calcularSumatoriaSanciones();
        this.isLoading = false;
      });
  }

  calcularSumatoriaSanciones() {
    this.sanciones.forEach((sancion) => {
      switch (sancion.tipo) {
        case "Llamado de atencón":
          this.sumatoriaSanciones[0] += sancion.cantidad;
          break;
        case "Apercibimiento":
          this.sumatoriaSanciones[1] += sancion.cantidad;
          break;
        case "Amonestacion":
          this.sumatoriaSanciones[2] += sancion.cantidad;
          break;
        case "Suspencion":
          this.sumatoriaSanciones[3] += sancion.cantidad;
          break;
      }
    });
  }

  calcularPromedio(index) {
    var notas: number = 0;
    var cont: number = 0;
    this.resumen[index].calificaciones[0][0].forEach((nota) => {
      if (nota != 0 && nota != null) {
        notas = notas + nota;
        cont++;
      }
    });
    if (cont != 0) this.promedioT1 = notas / cont;
    else this.promedioT1 = 0;
    notas = 0;
    cont = 0;
    this.resumen[index].calificaciones[1][0].forEach((nota) => {
      if (nota != 0 && nota != null) {
        notas = notas + nota;
        cont++;
      }
    });
    if (cont != 0) this.promedioT2 = notas / cont;
    else this.promedioT2 = 0;
    notas = 0;
    cont = 0;
    this.resumen[index].calificaciones[2][0].forEach((nota) => {
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

    this.promedioF[index] = this.promedio;
    this.obtenerPromedioGeneral();
    return this.promedio;
  }

  contadorNotasValidas(index): number {
    var cont = 0;
    this.resumen[index].calificaciones.forEach((nota) => {
      if (nota != 0 && nota != null) cont++;
    });
    return cont;
  }

  reordenarCalificaciones() {
    for (let i = 0; i < this.resumen.length; i++) {
      if (this.resumen[i].trimestre[0][0] != 1) {
        if (this.resumen[i].trimestre[1][0] != 1) {
          if (this.resumen[i].trimestre[2][0] == 1) {
            let auxCal = this.resumen[i].calificaciones[0];
            let auxTrim = this.resumen[i].trimestre[0][0];
            this.resumen[i].calificaciones[0] = this.resumen[
              i
            ].calificaciones[2];
            this.resumen[i].calificaciones[2] = auxCal;
            this.resumen[i].trimestre[0][0] = 1;
            this.resumen[i].trimestre[2][0] = auxTrim;
            if (this.resumen[i].trimestre[1][0] != 2) {
              let auxCal = this.resumen[i].calificaciones[1];
              this.resumen[i].calificaciones[1] = this.resumen[
                i
              ].calificaciones[2];
              this.resumen[i].calificaciones[2] = auxCal;
              this.resumen[i].trimestre[1][0] = 2;
              this.resumen[i].trimestre[2][0] = 3;
            }
          }
        } else {
          let auxCal = this.resumen[i].calificaciones[0];
          let auxTrim = this.resumen[i].trimestre[0][0];
          this.resumen[i].calificaciones[0] = this.resumen[i].calificaciones[1];
          this.resumen[i].calificaciones[1] = auxCal;
          this.resumen[i].trimestre[0][0] = 1;
          this.resumen[i].trimestre[1][0] = auxTrim;
          if (this.resumen[i].trimestre[1][0] != 2) {
            let auxCal = this.resumen[i].calificaciones[1];
            this.resumen[i].calificaciones[1] = this.resumen[
              i
            ].calificaciones[2];
            this.resumen[i].calificaciones[2] = auxCal;
            this.resumen[i].trimestre[1][0] = 2;
            this.resumen[i].trimestre[2][0] = 3;
          }
        }
      } else {
        if (this.resumen[i].trimestre[1][0] != 2) {
          let auxCal = this.resumen[i].calificaciones[1];
          this.resumen[i].calificaciones[1] = this.resumen[i].calificaciones[2];
          this.resumen[i].calificaciones[2] = auxCal;
          this.resumen[i].trimestre[1][0] = 2;
          this.resumen[i].trimestre[2][0] = 3;
        }
      }
    }
  }

  obtenerPromedioGeneral() {
    let cont = 0;
    let sum = 0;
    for (let index = 0; index < this.promedioF.length; index++) {
      if (this.promedioF[index] != 0) {
        sum += this.promedioF[index];
        cont++;
      }
    }
    if(cont!=0)
    this.promedioGeneral = sum / cont;
    else
    this.promedioGeneral=0;
  }

  public descargarPDF() {
    var element = document.getElementById("content");

    html2canvas(element).then((canvas) => {
      var imgData = canvas.toDataURL("image/png");
      var doc = new jsPDF();
      var imgH = (canvas.height * 208) / canvas.width;
      // doc.text("Calificaciones Ciclo Lectivo", 7, 15);
      doc.addImage(imgData, 0, 30, 208, imgH);
      doc.save("ResumenAcadémico.pdf");
    });
  }
}
