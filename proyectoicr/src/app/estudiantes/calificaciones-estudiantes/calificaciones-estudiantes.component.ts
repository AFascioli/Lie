import { AutenticacionService } from "./../../login/autenticacionService.service";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Component, OnInit, ViewChild } from "@angular/core";
import { MatDialogRef, MatDialog, MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";
import { NgForm, NgModel } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { CalificacionesService } from '../calificaciones.service';

@Component({
  selector: "app-calificaciones-estudiantes",
  templateUrl: "./calificaciones-estudiantes.component.html",
  styleUrls: ["./calificaciones-estudiantes.component.css"]
})
export class CalificacionesEstudiantesComponent implements OnInit {
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

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioCalificaciones: CalificacionesService,
    public popup: MatDialog,
    private snackBar: MatSnackBar,
    public servicioEstudianteAutenticacion: AutenticacionService
  ) {}

  ngOnInit() {
    this.fechaActual = new Date();
    this.obtenerTrimestreActual();
    this.validarPermisos();
    this.obtenerCursos();
  }

  validarPermisos() {
    this.servicioEstudianteAutenticacion.obtenerPermisosDeRol().subscribe(res => {
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

  onCursoSeleccionado(curso, materia: NgModel) {
    this.estudiantes = null;
    this.materias = null;
    materia.reset();
    if (
      this.rolConPermisosEdicion &&
      this.servicioEstudianteAutenticacion.getRol() != "Admin"
    ) {
      this.servicioEstudiante
        .obtenerMateriasXCursoXDocente(curso.value, this.servicioEstudianteAutenticacion.getId())
        .subscribe(respuesta => {
          this.materias = respuesta.materias;
        });
    } else {
      this.servicioEstudiante.obtenerMateriasDeCurso(curso.value).subscribe(respuesta => {
        this.materias = respuesta.materias;
      });
    }
  }

  obtenerNotas(form: NgForm) {
    if (form.value.curso != "" || form.value.materia != "") {
      this.servicioCalificaciones
    //this.servicioEstudiante
        .obtenerCalificacionesEstudiantesXCursoXMateria(
          form.value.curso,
          form.value.materia,
          form.value.trimestre
        )
        .subscribe(respuesta => {
          this.estudiantes = [...respuesta.estudiantes];
          this.estudiantes = this.estudiantes.sort((a, b) =>
            a.apellido > b.apellido ? 1 : b.apellido > a.apellido ? -1 : 0
          );
          console.log(this.estudiantes);
          this.dataSource = new MatTableDataSource(this.estudiantes);
          this.dataSource.paginator = this.paginator;
          this.dataSource.paginator.firstPage();
        });
    }
  }

  indexEstudiante() {
    this.indexEst = this.paginator.pageIndex * this.paginator.pageSize;
  }

  calcularPromedio(index, cantidad) {
    if (cantidad!=0)
    {var notas: number = 0;
    this.estudiantes[index].calificaciones.forEach(nota => {
      if (nota != 0 && nota != null) notas = notas + nota;
    });
    this.promedio = notas / cantidad;
    }
    else  this.promedio = 0;
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
    //this.servicioEstudiante
        .registrarCalificaciones(
          this.estudiantes,
          form.value.materia,
          form.value.trimestre
        )
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
    this.servicioEstudiante.tipoPopUp = "cancelar";
    this.popup.open(CalificacionesEstudiantePopupComponent);
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

@Component({
  selector: "app-calificaciones-estudiantes",
  templateUrl: "./calificaciones-estudiantes-popup.component.html",
  styleUrls: ["./calificaciones-estudiantes.component.css"]
})
export class CalificacionesEstudiantePopupComponent {
  constructor(
    public dialogRef: MatDialogRef<CalificacionesEstudiantePopupComponent>,
    public router: Router
  ) {}

  onYesCancelarClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  onNoCancelarClick(): void {
    this.dialogRef.close();
  }
}
