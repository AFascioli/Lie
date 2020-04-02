import { MatSnackBar, MatDialog, MatDialogRef } from "@angular/material";
import { AutenticacionService } from "src/app/login/autenticacionService.service";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { EventosService } from "../eventos.service";
import { Evento } from "../evento.model";
import { Comentario } from "../comentario.model";
import { Router } from "@angular/router";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-visualizar-evento",
  templateUrl: "./visualizar-evento.component.html",
  styleUrls: ["./visualizar-evento.component.css"]
})
export class VisualizarEventoComponent implements OnInit, OnDestroy {
  evento: Evento;
  descripcionComentario: String;
  comentarioIsEmpty: Boolean = true;
  permisos: Boolean[] = [];
  imgURL: any;
  filename: any;
  tituloEvento: string;
  descripcionDelEvento: string;
  fechaDelEvento: Date;
  horaFinal: string;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public eventoService: EventosService,
    public autenticacionService: AutenticacionService,
    public popup: MatDialog,
    public servicioEstudiante: EstudiantesService,
    public snackBar: MatSnackBar,
    public router: Router
  ) {}

  ngOnInit() {
    this.evento = this.eventoService.eventoSeleccionado;
    this.eventoService
      .obtenerComentariosDeEvento()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(rtdo => {
        this.eventoService.comentarios = rtdo.comentarios.reverse();
        this.actualizarPermisos();
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  actualizarPermisos() {
    for (let i = 0; i < this.eventoService.comentarios.length; i++) {
      if (
        this.eventoService.comentarios[i].idUsuario ==
          this.autenticacionService.getId() ||
        this.autenticacionService.getRol() == "Admin"
      )
        this.permisos[i] = true;
      else this.permisos[i] = false;
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

  onCambiosComentario() {
    if (this.descripcionComentario || this.descripcionComentario.trim()) {
      this.comentarioIsEmpty = false;
    }
  }

  onGuardar(descripcion) {
    console.log(descripcion);
    if (!this.descripcionComentario || !this.descripcionComentario.trim()) {
      this.snackBar.open("El comentario esta vacío", "", {
        duration: 4500,
        panelClass: ["snack-bar-fracaso"]
      });
    } else {
      const comentario: Comentario = {
        idUsuario: null,
        cuerpo: descripcion,
        nombre: null,
        apellido: null,
        fecha: new Date()
      };
      this.eventoService
        .publicarComentario(
          comentario,
          this.autenticacionService.getUsuarioAutenticado(),
          this.autenticacionService.getRol()
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(rtdo => {
          if (rtdo.exito) {
            this.snackBar.open(rtdo.message, "", {
              duration: 4500,
              panelClass: ["snack-bar-exito"]
            });
            this.descripcionComentario = "";
            this.eventoService
              .obtenerComentariosDeEvento()
              .pipe(takeUntil(this.unsubscribe))
              .subscribe(rtdo => {
                this.eventoService.comentarios = rtdo.comentarios.reverse();
                this.actualizarPermisos();
              });
          } else {
            this.snackBar.open(
              "Ocurrio un error al querer publicar el comentario",
              "",
              {
                duration: 4500,
                panelClass: ["snack-bar-fracaso"]
              }
            );
          }
        });
    }
  }

  onEliminar(idComentario): void {
    this.eventoService
      .eliminarComentario(idComentario)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(response => {
        if (response.exito) {
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500
          });
        }
        this.eventoService
          .obtenerComentariosDeEvento()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe(rtdo => {
            this.eventoService.comentarios = rtdo.comentarios.reverse();
          });
      });
  }
}
