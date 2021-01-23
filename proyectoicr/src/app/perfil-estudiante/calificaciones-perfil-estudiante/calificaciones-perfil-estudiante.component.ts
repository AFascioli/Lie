import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { CalificacionesService } from "../../calificaciones/calificaciones.service";
//import { Estudiante } from "src/app/estudiantes/estudiante.model";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { AutenticacionService } from "src/app/login/autenticacionService.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
  selector: "app-calificaciones-perfil-estudiante",
  templateUrl: "./calificaciones-perfil-estudiante.component.html",
  styleUrls: ["./calificaciones-perfil-estudiante.component.css"],
})
export class CalificacionesPerfilEstudianteComponent
  implements OnInit, OnDestroy {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  curso: string;
  calificacionesXMateria: any[];
  displayedColumns: string[] = [
    "materia",
    "calif1",
    "calif2",
    "calif3",
    "calif4",
    "calif5",
    "calif6",
    "prom",
  ];
  trimestreActual: string;
  fechaActual: Date;
  promedio = 0;
  private unsubscribe: Subject<void> = new Subject();
  materiasPendientes = [];
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(
    public servicioEstudiante: EstudiantesService,
    public servicioCalificaciones: CalificacionesService,
    public router: Router,
    public cicloLectivoService: CicloLectivoService,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 880px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit() {
    this.fechaActual = new Date();
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;

    this.obtenerTrimestrePorDefectoYCalificaciones();

    this.servicioEstudiante.obtenerCursoDeEstudiante().subscribe((response) => {
      this.curso = response.curso;
    });

    this.servicioCalificaciones
      .obtenerMateriasDesaprobadasEstudiante(
        this.servicioEstudiante.estudianteSeleccionado._id
      )
      .subscribe((materias) => {
        if (materias.materiasDesaprobadas != null) {
          this.materiasPendientes = materias.materiasDesaprobadas;
        }
      });
  }

  onChangeTrimestre() {
    this.servicioCalificaciones
      .obtenerCalificacionesXMateriaXEstudiante(this.trimestreActual)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.calificacionesXMateria = res.vectorCalXMat;
        this.calificacionesXMateria.sort((a, b) =>
          a.materia > b.materia ? 1 : b.materia > a.materia ? -1 : 0
        );
      });
  }

  calcularPromedio(index, cantidad) {
    var notas: number = 0;
    this.calificacionesXMateria[index].calificaciones.forEach((nota) => {
      if (nota != 0 && nota != null) notas = notas + nota;
    });
    this.promedio = notas / cantidad;
    return this.promedio;
  }

  obtenerCalificacionesEstudiante() {
    this.servicioCalificaciones
      .obtenerCalificacionesXMateriaXEstudiante(this.trimestreActual)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.calificacionesXMateria = res.vectorCalXMat;
        this.calificacionesXMateria.sort((a, b) =>
          a.materia > b.materia ? 1 : b.materia > a.materia ? -1 : 0
        );
      });
  }

  obtenerTrimestrePorDefectoYCalificaciones() {
    this.cicloLectivoService
      .obtenerEstadoCicloLectivo()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(async (response) => {
        let estado = await response.estadoCiclo;
        switch (estado) {
          case "En primer trimestre":
            this.trimestreActual = "1";
            break;
          case "En segundo trimestre":
            this.trimestreActual = "2";
            break;
          case "En tercer trimestre":
            this.trimestreActual = "3";
            break;
          default:
            this.trimestreActual = "3";
            break;
        }
        this.obtenerCalificacionesEstudiante();
      });
  }

  //Dado el indice de la tabla que representa una materia, retorna cuantas
  //notas tienen valor distinto a cero
  contadorNotasValidas(index): number {
    var cont = 0;
    this.calificacionesXMateria[index].calificaciones.forEach((nota) => {
      if (nota != 0 && nota != null) cont++;
    });
    return cont;
  }
}
