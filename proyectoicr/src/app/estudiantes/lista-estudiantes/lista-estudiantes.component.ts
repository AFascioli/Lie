import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import { UbicacionService } from "src/app/ubicacion/ubicacion.service";
import { CalificacionesService } from "../../calificaciones/calificaciones.service";
import { InscripcionService } from "../../inscripcion/inscripcion.service";
import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "../estudiante.service";
import { Estudiante } from "../estudiante.model";
import { Router } from "@angular/router";

@Component({
  selector: "app-lista-estudiantes",
  templateUrl: "./lista-estudiantes.component.html",
  styleUrls: ["./lista-estudiantes.component.css"]
})
export class ListaEstudiantesComponent implements OnInit {
  estudiantes: Estudiante[] = [];
  curso: any[] = [];

  permisos = {
    notas: 0,
    asistencia: 0,
    eventos: 0,
    sanciones: 0,
    agendaCursos: 0,
    inscribirEstudiante: 0,
    registrarEmpleado: 0,
    cuotas: 0
  };
  isLoading: boolean = true;

  constructor(
    public servicio: EstudiantesService,
    public servicioCalificaciones: CalificacionesService,
    public servicioAsistencia: AsistenciaService,
    public servicioInscripcion: InscripcionService,
    public servicioUbicacion: UbicacionService,
    public router: Router,
    public authService: AutenticacionService
  ) {}

  ngOnInit() {
    if ((this.servicio.retornoDesdeAcciones = false)) {
      this.isLoading = true;
    } else {
      this.servicio.getEstudiantesListener().subscribe(estudiantesBuscados => {
        this.estudiantes = estudiantesBuscados;
        this.isLoading = false;
        for (let i = 0; i < estudiantesBuscados.length; i++) {
          this.servicio
            .obtenerCursoDeEstudianteById(this.estudiantes[i]._id)
            .subscribe(response => {
              this.curso[i] = response.curso;
            });
        }
      });

      if (this.servicio.retornoDesdeAcciones) {
        this.servicio.retornoDesdeAcciones = false;
      }
      this.authService.obtenerPermisosDeRol().subscribe(response => {
        this.permisos = response.permisos;
      });
    }
  }

  asignarEstudianteSeleccionado(indice) {
    this.servicio.estudianteSeleccionado = this.estudiantes.find(
      estudiante =>
        estudiante.numeroDocumento === this.estudiantes[indice].numeroDocumento
    );
    this.servicioCalificaciones.estudianteSeleccionado = this.servicio.estudianteSeleccionado;
    this.servicioAsistencia.estudianteSeleccionado = this.servicio.estudianteSeleccionado;
    this.servicioInscripcion.estudianteSeleccionado = this.servicio.estudianteSeleccionado;
    this.servicioUbicacion.estudianteSeleccionado = this.servicio.estudianteSeleccionado;
    this.servicio.retornoDesdeAcciones = true;
  }

  onInscribir(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./curso"]);
  }

  onMostrar(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./mostrar"]);
  }

  onRetiro(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./retiroAnticipado"]);
  }

  onLlegadaTarde(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./llegadaTarde"]);
  }

  onVisualizarPerfil(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./perfilEstudiante"]);
  }

  onSancion(indice){
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./registrarSancion"]);
  }

  onJustificar(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./justificarInasistencia"]);
  }

  onRegistrarAR(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./altaAdultoResponsable"]);
  }

  onRegistrarExamenes(indice) {
    this.asignarEstudianteSeleccionado(indice);
    this.router.navigate(["./calificacionesExamenes"]);
  }
}
