import { Router } from '@angular/router';
import { UbicacionService } from './../ubicacion/ubicacion.service';
import { InscripcionService } from './../inscripcion/inscripcion.service';
import { CalificacionesService } from './../calificaciones/calificaciones.service';
import { AsistenciaService } from './../asistencia/asistencia.service';
import { EstudiantesService } from './../estudiantes/estudiante.service';
import { EventosService } from './../eventos/eventos.service';
import { AutenticacionService } from "./../login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { AdultoResponsableService } from "../adulto-responsable/adultoResponsable.service";
import { Estudiante } from '../estudiantes/estudiante.model';

@Component({
  selector: "app-menu-principal-ar",
  templateUrl: "./menu-principal-ar.component.html",
  styleUrls: ["./menu-principal-ar.component.css"]
})
export class MenuPrincipalARComponent implements OnInit {
  estudiantes;
  eventos;
  constructor(
    public authService: AutenticacionService,
    public servicioAR: AdultoResponsableService,
    public servicioEvento: EventosService,
    public servicioEstudiante: EstudiantesService,
    public servicioCalificaciones: CalificacionesService,
    public servicioAsistencia: AsistenciaService,
    public servicioInscripcion: InscripcionService,
    public servicioUbicacion: UbicacionService,
    public router: Router
  ) {}

  ngOnInit() {
    let cursos = [];
    this.servicioAR
      .getDatosEstudiantes(this.authService.getId())
      .subscribe(response => {
        this.estudiantes = response.estudiantes;
        this.estudiantes.forEach(estudiante => {
          cursos.push(estudiante.curso);
        });
        this.servicioEvento.obtenerEventosDeCursos(cursos.join(",")).subscribe(response => {
           this.eventos=response.eventos;
        });
      });
  }

  obtenerMes(fechaEvento) {
    let fecha = new Date(fechaEvento);
    let rtdoMes = fecha.toLocaleString("es-ES", { month: "long" });
    return rtdoMes.charAt(0).toUpperCase() + rtdoMes.slice(1);
  }

  obtenerDia(fechaEvento) {
    let fecha = new Date(fechaEvento);
    return fecha.getDate();
  }

  onEstudianteClick(idEstudiante: string){
    this.servicioEstudiante.obtenerEstudiantePorId(idEstudiante).subscribe(response => {
       if(response.exito){
         this.asignarEstudianteSeleccionado(response.estudiante);
         this.router.navigate(["./perfilEstudiante"]);
       }
    });
  }

  asignarEstudianteSeleccionado(estudiante: Estudiante) {
    this.servicioEstudiante.estudianteSeleccionado =estudiante;
    this.servicioCalificaciones.estudianteSeleccionado = this.servicioEstudiante.estudianteSeleccionado;
    this.servicioAsistencia.estudianteSeleccionado = this.servicioEstudiante.estudianteSeleccionado;
    this.servicioInscripcion.estudianteSeleccionado = this.servicioEstudiante.estudianteSeleccionado;
    this.servicioUbicacion.estudianteSeleccionado = this.servicioEstudiante.estudianteSeleccionado;
    // this.servicioEstudiante.retornoDesdeAcciones = true;
  }
}
