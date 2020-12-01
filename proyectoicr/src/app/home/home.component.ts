import { environment } from "src/environments/environment";
import { EventosService } from "./../eventos/eventos.service";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { AutenticacionService } from "../login/autenticacionService.service";
import { Router } from "@angular/router";
import { Evento } from "../eventos/evento.model";
import { MatSnackBar, MatDialogRef, MatDialog } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

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

  constructor(
    public snackBar: MatSnackBar,
    private swPush: SwPush,
    private servicioAuth: AutenticacionService,
    public router: Router,
    public servicioEvento: EventosService,
    public dialog: MatDialog
  ) {}

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
    let auxEventoPasado = [];
    let auxEventoProximo = [];
    this.fechaActual = new Date();
    this.servicioEvento
      .obtenerEvento()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rtdo) => {
        this.eventos = rtdo.eventos;
        for (let index = 0; index < rtdo.eventos.length; index++) {
          if (this.eventoYaOcurrio(index))
            auxEventoPasado.push(rtdo.eventos[index]);
          else auxEventoProximo.push(rtdo.eventos[index]);
        }
        setTimeout(() => {
          auxEventoPasado.sort((a, b) => this.compareFechaEventos(a, b));
          auxEventoProximo.sort((a, b) => this.compareFechaEventos(a, b));
        }, 100);

        setTimeout(() => {
          this.eventos = auxEventoProximo.concat(auxEventoPasado);
          this.isLoading = false;
        }, 250);
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

  //Compara la fecha del evento con la fecha actual para deshabilitar el boton editar
  //si el evento ya paso. Si estamos en el dia del evento, devuelve true si ya estamos
  //en la misma hora que el evento
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
      this.servicioAuth.getId() == this.eventos[indiceEvento].autor
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
