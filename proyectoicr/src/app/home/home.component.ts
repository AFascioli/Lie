import { environment } from 'src/environments/environment';
import { async } from "@angular/core/testing";
import { EventosService } from "./../eventos/eventos.service";
import { Component, OnInit } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { AutenticacionService } from "../login/autenticacionService.service";
import { Router } from "@angular/router";
import { Evento } from "../eventos/evento.model";
import { MatSnackBar, MatDialogRef, MatDialog } from "@angular/material";

//Parche para la demo #resolve
declare var require: any;

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit {
  eventos: Evento[];
  imagen;
  fechaActual;
  readonly VAPID_PUBLIC =
    "BMlC2dLJTBP6T1GCl3S3sDBmhERNVcjN7ff2a6JAoOg8bA_qXjikveleRwjz0Zn8c9-58mnrNo2K4p07UPK0DKQ";

  evento: Evento;
  constructor(
    public snackBar: MatSnackBar,
    private swPush: SwPush,
    private servicioAuth: AutenticacionService,
    public router: Router,
    public servicioEvento: EventosService,
    public dialog: MatDialog
  ) {}

  getImage(imgUrl){
      return `${environment.apiUrl}/evento/imagenes?imgUrl=${imgUrl}`
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

  ngOnInit() {
    this.fechaActual = new Date();
    this.servicioEvento.obtenerEvento().subscribe(rtdo => {
      this.eventos = rtdo.eventos;
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("ngsw-worker.js").then(swreg => {
        if (swreg.active) {
          console.log("Se registro el service worker.");
          this.subscribeToNotifications();
        }
      });
    }
    this.servicioEvento.eventoSeleccionado = null;
  }

  eventoSeleccionado(evento: Evento) {
    this.servicioEvento.eventoSeleccionado = evento;
    this.router.navigate(["/visualizarEvento"]);
  }

  // obra = require("../../img/acto.jpg");
  // desfile = require("../../img/desfile.jpg");

  subscribeToNotifications() {
    if (Notification.permission === "granted") {
      console.log("Ya se otorgó el permiso de envio de notificaciones.");
    } else {
      this.swPush
        .requestSubscription({
          serverPublicKey: this.VAPID_PUBLIC
        })
        .then(pushsub => {
          this.servicioAuth.addPushSubscriber(pushsub).subscribe(res => {
            console.log("Se suscribió a recibir notificaciones push.");
          });
        })
        .catch(err =>
          console.error("No se pudo suscribir a las notificaciones push.", err)
        );
    }
  }
  onEditar(evento) {
    this.servicioEvento.evento = evento;
    this.router.navigate(["./verEvento"]);
  }
  onBorrar(evento) {
    this.servicioEvento.evento = evento;
    this.dialog.open(BorrarPopupComponent, {
      width: "250px"
    });
  }

  conocerUsuarioLogueado(indiceEvento): boolean {
    let mostrarBoton = false;
    if (
      this.servicioAuth.getRol() == "Admin" ||
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
    "../estudiantes/mostrar-estudiantes/mostrar-estudiantes.component.css"
  ]
})
export class BorrarPopupComponent {
 // titulo: string;

  constructor(
    public dialogRef: MatDialogRef<BorrarPopupComponent>,
    public router: Router,
    public servicioEvento: EventosService
  ) {
    //this.eve = this.servicioEvento.evento.titulo;
  }

  onYesClick(): void {
    this.servicioEvento.eliminarEvento(this.servicioEvento.evento._id);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
