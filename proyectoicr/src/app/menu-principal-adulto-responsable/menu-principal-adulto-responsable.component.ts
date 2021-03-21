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
import { CicloLectivoService } from "../cicloLectivo.service";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-menu-principal-adulto-responsable",
  templateUrl: "./menu-principal-adulto-responsable.component.html",
  styleUrls: ["./menu-principal-adulto-responsable.component.css"],
})
export class MenuPrincipalAdultoResponsableComponent implements OnInit {
  estudiantes;
  idEstudiantes = [];
  aniosEventos = [];
  eventos;
  eventosFiltrados=[];
  anioSeleccionado: number;
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
    public servicioCiclo: CicloLectivoService,
    public router: Router,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher,
    public snackBar: MatSnackBar
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.servicioCiclo
      .obtenerActualYSiguiente()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.anioSeleccionado = response.añosCiclos[0];
        this.obtenerDatosEstudiante();
      });
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
    if (Notification.permission === "granted") {
    } else {
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
    }
  }

  obtenerDatosEstudiante() {
    let auxEventoPasado = [];
    let auxEventoProximo = [];
    this.servicioAR
      .getDatosEstudiantes(this.authService.getId())
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (response) => {
          this.estudiantes = response.estudiantes;
          this.estudiantes.forEach((estudiante) => {
            this.cursos.push(estudiante.curso);
            this.idEstudiantes.push(estudiante.idEstudiante);
          });
          this.servicioEvento
            .obtenerEventosDeCursos(this.idEstudiantes)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((response) => {
              this.aniosEventos = response.aniosEventos;
              this.anioSeleccionado = this.aniosEventos[
                this.aniosEventos.length - 1
              ];
              this.eventos = response.eventos;
              for (let index = 0; index < this.eventos.length; index++) {
                const anioEvento = new Date(
                  this.eventos[index].fechaEvento
                ).getFullYear();
                this.eventos[index].anioEvento = anioEvento;
              }
              this.filtrarEventos(this.anioSeleccionado);
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

  onAnioSelectedChange(anio) {
    this.anioSeleccionado = anio;
    this.filtrarEventos(this.anioSeleccionado);
  }

  filtrarEventos(anio) {
    let auxEventoPasado = [];
    let auxEventoProximo = [];

    for (let index = 0; index <= this.eventos.length - 1; index++) {
      const evento = this.eventos[index];
      console.log(anio , " ",evento.anioEvento);
      if (anio == evento.anioEvento) {
        this.eventoYaOcurrio(index)
          ? auxEventoPasado.push(evento)
          : auxEventoProximo.push(evento);
      }
    }
    auxEventoPasado.sort((a, b) => this.compareFechaEventos(a, b));
    auxEventoProximo.sort((a, b) => this.compareFechaEventos(a, b));
    this.eventosFiltrados = auxEventoProximo.concat(auxEventoPasado);
    
    
  }

  eventoYaOcurrio(indexEvento: number) {
    const fechaActual = new Date();
    const fechaEvento = new Date(this.eventos[indexEvento].fechaEvento);
    if (
      fechaActual.getMonth() == fechaEvento.getMonth() &&
      fechaActual.getDate() == fechaEvento.getDate()
    ) {
      const horaEvento = new Date(
        "01/01/2020 " + this.eventos[indexEvento].horaInicio
      );
      return fechaActual.getHours() >= horaEvento.getHours();
    } else {
      return fechaActual.getTime() > fechaEvento.getTime();
    }
  }

  compareFechaEventos(a, b) {
    if (a.fechaEvento < b.fechaEvento) {
      return -1;
    }
    if (a.fechaEvento > b.fechaEvento) {
      return 1;
    }
    return 0;
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
    if (this.cursos[0]) {
      this.servicioEstudiante
        .obtenerEstudiantePorId(idEstudiante)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          if (response.exito) {
            this.asignarEstudianteSeleccionado(response.estudiante);
            this.router.navigate(["./perfilEstudiante"]);
          }
        });
    } else {
      this.snackBar.open(
        "El estudiante no está inscripto en ningún curso",
        "",
        {
          panelClass: ["snack-bar-fracaso"],
          duration: 4000,
        }
      );
    }
  }

  onEventoClick(idEvento: string) {
    this.servicioEvento
      .obtenerEventoPorId(idEvento)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
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
