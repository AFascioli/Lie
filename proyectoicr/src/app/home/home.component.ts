import { environment } from "src/environments/environment";
import { EventosService } from "./../eventos/eventos.service";
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { AutenticacionService } from "../login/autenticacionService.service";
import { Router } from "@angular/router";
import { Evento } from "../eventos/evento.model";
import { MatSnackBar, MatDialogRef, MatDialog } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { MediaMatcher } from "@angular/cdk/layout";
import { CicloLectivoService } from "../cicloLectivo.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit, OnDestroy {
  private unsubscribe: Subject<void> = new Subject();
  eventos: Evento[] = [];
  imagen;
  fechaActual;
  readonly VAPID_PUBLIC =
    "BMlC2dLJTBP6T1GCl3S3sDBmhERNVcjN7ff2a6JAoOg8bA_qXjikveleRwjz0Zn8c9-58mnrNo2K4p07UPK0DKQ";
  evento: Evento;
  enProcesoDeBorrado: boolean = false;
  isLoading: boolean = true;
  mostrarTooltip: boolean = true;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  aniosEventos: any[] = [];
  anioSeleccionado: number;
  eventosFiltrados: any[] = [];

  constructor(
    public snackBar: MatSnackBar,
    private swPush: SwPush,
    private servicioAuth: AutenticacionService,
    public router: Router,
    public servicioEvento: EventosService,
    public servicioCiclo: CicloLectivoService,
    public dialog: MatDialog,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 800px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  eventoSeleccionado(evento: Evento) {
    if (!this.enProcesoDeBorrado) {
      this.servicioEvento.eventoSeleccionado = evento;
      this.router.navigate(["/visualizarEvento"]);
    }
  }

  getImage(filename) {
    return environment.apiUrl + `/imagen/${filename}`;
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

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit() {
    console.log("Version 4/3/2021");
    this.fechaActual = new Date();

    this.servicioEvento
      .obtenerEvento()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rtdo) => {
        this.eventos = rtdo.eventos;

        this.servicioCiclo
          .obtenerActualYAnteriores()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            this.aniosEventos = res.añosCiclos.reverse();
            this.anioSeleccionado = this.servicioEvento.anioSeleccionadoEvento
              ? this.servicioEvento.anioSeleccionadoEvento
              : this.aniosEventos[0];
            this.servicioEvento.anioSeleccionadoEvento = this.anioSeleccionado;

            for (let index = 0; index < rtdo.eventos.length; index++) {
              const anioEvento = new Date(
                rtdo.eventos[index].fechaEvento
              ).getFullYear();
              rtdo.eventos[index].anioEvento = anioEvento;
            }
            this.filtrarEventos(this.anioSeleccionado);

            this.aniosEventos.sort((a, b) => this.compareAnioEventos(a, b));
            this.isLoading = false;
          });
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

  filtrarEventos(anio) {
    let auxEventoPasado = [];
    let auxEventoProximo = [];

    for (let index = 0; index <= this.eventos.length - 1; index++) {
      const evento = this.eventos[index];

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
  mostrarEvento(anioEvento) {
    return anioEvento == this.anioSeleccionado;
  }

  onAnioSelectedChange(anio) {
    this.eventosFiltrados=[]
    this.anioSeleccionado = anio;
    this.servicioEvento.anioSeleccionadoEvento = this.anioSeleccionado;
    this.filtrarEventos(this.anioSeleccionado);
    
  }

  //Compara la fecha del evento con la fecha actual para deshabilitar el boton editar
  //si el evento ya paso. Si estamos en el dia del evento, devuelve true si ya estamos
  //en la misma hora que el evento
  eventoYaOcurrio(indexEvento: number) {
    let eventosArray= this.eventos;
    if(this.eventosFiltrados.length!=0){
      eventosArray= this.eventosFiltrados;
    }
    const fechaEvento = new Date(eventosArray[indexEvento].fechaEvento);    
    if (
      this.fechaActual.getMonth() == fechaEvento.getMonth() &&
      this.fechaActual.getDate() == fechaEvento.getDate()
    ) {
      const horaEvento = new Date(
        "01/01/2020 " + eventosArray[indexEvento].horaInicio
      );
      return this.fechaActual.getHours() >= horaEvento.getHours();
    } else {
      return this.fechaActual.getTime() > fechaEvento.getTime();
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

  compareAnioEventos(a, b) {
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  }

  subscribeToNotifications() {
    if (Notification.permission === "granted") {
    } else {
      this.swPush
        .requestSubscription({
          serverPublicKey: this.VAPID_PUBLIC,
        })
        .then((pushsub) => {
          this.servicioAuth
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

  onEditar(evento) {
    this.servicioEvento.evento = evento;
    this.servicioEvento.eventoSeleccionado = evento;
    this.servicioEvento.imageOnly = false;
    this.router.navigate(["./modificarEvento"]);
  }

  onAgregarFoto(evento) {
    this.servicioEvento.evento = evento;
    this.servicioEvento.eventoSeleccionado = evento;
    this.servicioEvento.imageOnly = true;
    this.router.navigate(["./modificarEvento"]);
  }

  onBorrar(evento) {
    this.enProcesoDeBorrado = true;
    this.servicioEvento.evento = evento;
    let popup = this.dialog.open(BorrarPopupComponent, {
      width: "250px",
    });
    // Luego de que se cierra el popup, se fija si se eligio si o no, en caso de si se borra.
    popup.afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.servicioEvento
          .eliminarEvento(this.servicioEvento.evento._id)
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((response) => {
            if (response.exito) {
              this.servicioEvento
                .obtenerEvento()
                .pipe(takeUntil(this.unsubscribe))
                .subscribe((rtdo) => {
                  this.eventos = rtdo.eventos;
                  this.enProcesoDeBorrado = false;
                  this.snackBar.open(response.message, "", {
                    panelClass: ["snack-bar-exito"],
                    duration: 4500,
                  });
                });
            }
          });
      }
    });
  }

  conocerUsuarioLogueado(indiceEvento): boolean {
    let mostrarBoton = false;    
    if (
      this.servicioAuth.getRol() == "Admin" ||
      this.servicioAuth.getRol() == "Director" ||
      this.servicioAuth.getRol() == "Preceptor" ||
      this.servicioAuth.getId() == this.eventosFiltrados[indiceEvento].autor
    )
      mostrarBoton = true;
    return mostrarBoton;
  }
}

@Component({
  selector: "app-borrar-popup",
  templateUrl: "./borrar-popup.component.html",
  styleUrls: [
    "../estudiantes/mostrar-estudiantes/mostrar-estudiantes.component.css",
  ],
})
export class BorrarPopupComponent {
  constructor(public dialogRef: MatDialogRef<BorrarPopupComponent>) {}

  onYesClick(): void {
    this.dialogRef.close(true);
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
