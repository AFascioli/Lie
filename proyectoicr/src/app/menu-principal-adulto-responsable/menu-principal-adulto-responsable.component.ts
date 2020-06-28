import { Router } from "@angular/router";
import { UbicacionService } from "../ubicacion/ubicacion.service";
import { InscripcionService } from "../inscripcion/inscripcion.service";
import { CalificacionesService } from "../calificaciones/calificaciones.service";
import { AsistenciaService } from "../asistencia/asistencia.service";
import { EstudiantesService } from "../estudiantes/estudiante.service";
import { EventosService } from "../eventos/eventos.service";
import { AutenticacionService } from "../login/autenticacionService.service";
import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { AdultoResponsableService } from "../adulto-responsable/adultoResponsable.service";
import { Estudiante } from "../estudiantes/estudiante.model";
import { MediaMatcher } from "@angular/cdk/layout";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { SwPush } from "@angular/service-worker";

@Component({
  selector: "app-menu-principal-adulto-responsable",
  templateUrl: "./menu-principal-adulto-responsable.component.html",
  styleUrls: ["./menu-principal-adulto-responsable.component.css"],
})
export class MenuPrincipalAdultoResponsableComponent implements OnInit {
  estudiantes;
  eventos;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  cursos = [];
  private unsubscribe: Subject<void> = new Subject();
  readonly VAPID_PUBLIC =
    "BMlC2dLJTBP6T1GCl3S3sDBmhERNVcjN7ff2a6JAoOg8bA_qXjikveleRwjz0Zn8c9-58mnrNo2K4p07UPK0DKQ";
  mostrarTooltip: boolean = true;

  constructor(
    private swPush: SwPush,
    public authService: AutenticacionService,
    public servicioAR: AdultoResponsableService,
    public servicioEvento: EventosService,
    public servicioEstudiante: EstudiantesService,
    public servicioCalificaciones: CalificacionesService,
    public servicioAsistencia: AsistenciaService,
    public servicioInscripcion: InscripcionService,
    public servicioUbicacion: UbicacionService,
    public router: Router,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.obtenerDatosEstudiante();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("ngsw-worker.js").then((swreg) => {
        if (swreg.active) {
          this.subscribeToNotifications();
        }
      });
    }

    setTimeout(() => {
      this.mostrarTooltip = false;
    }, 6010);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  subscribeToNotifications() {
    // if (Notification.permission === "granted") {
    // } else {
    this.swPush
      .requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC,
      })
      .then((pushsub) => {
        console.log("Paso requestSubscription");
        this.authService
          .addPushSubscriber(pushsub)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            console.log("Se suscribió a recibir notificaciones push.");
          });
      })
      .catch((err) =>
        console.error("No se pudo suscribir a las notificaciones push.", err)
      );
    // }
  }

  obtenerDatosEstudiante() {
    this.servicioAR.getDatosEstudiantes(this.authService.getId()).subscribe(
      (response) => {
        this.estudiantes = response.estudiantes;
        this.estudiantes.forEach((estudiante) => {
          this.cursos.push(estudiante.curso);
        });
        this.servicioEvento
          .obtenerEventosDeCursos(this.cursos.join(","))
          .subscribe((response) => {
            this.eventos = response.eventos;
          });
      },
      (error) => {
        console.log(
          "Ocurrió un error al querer obtener los datos del estudiante: ",
          error
        );
      }
    );
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

  onEstudianteClick(idEstudiante: string) {
    this.servicioEstudiante
      .obtenerEstudiantePorId(idEstudiante)
      .subscribe((response) => {
        if (response.exito) {
          this.asignarEstudianteSeleccionado(response.estudiante);
          this.router.navigate(["./perfilEstudiante"]);
        }
      });
  }

  onEventoClick(idEvento: string) {
    this.servicioEvento.obtenerEventoPorId(idEvento).subscribe((response) => {
      if (response.exito) {
        this.servicioEvento.eventoSeleccionado = response.evento;
        this.router.navigate(["./visualizarEvento"]);
      }
    });
  }

  asignarEstudianteSeleccionado(estudiante: Estudiante) {
    this.servicioEstudiante.estudianteSeleccionado = estudiante;
    this.servicioCalificaciones.estudianteSeleccionado = this.servicioEstudiante.estudianteSeleccionado;
    this.servicioAsistencia.estudianteSeleccionado = this.servicioEstudiante.estudianteSeleccionado;
    this.servicioInscripcion.estudianteSeleccionado = this.servicioEstudiante.estudianteSeleccionado;
    this.servicioUbicacion.estudianteSeleccionado = this.servicioEstudiante.estudianteSeleccionado;
  }
}
