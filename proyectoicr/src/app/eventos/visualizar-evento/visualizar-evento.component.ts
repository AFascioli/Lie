import { MatSnackBar, MatDialog, MatDialogRef } from "@angular/material";
import { AutenticacionService } from "src/app/login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { EventosService } from "../eventos.service";
import { Evento } from "../evento.model";
import { Comentario } from "../comentario.model";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";

@Component({
  selector: "app-visualizar-evento",
  templateUrl: "./visualizar-evento.component.html",
  styleUrls: ["./visualizar-evento.component.css"]
})
export class VisualizarEventoComponent implements OnInit {
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
    //Es el evento seleccionado en el home

    // if (this.evento == null) {
    //   this.router.navigate(["./home"]);
    // }
    this.imgURL = `http://localhost:3000/imagen/${this.evento.filename}`;
    this.eventoService.obtenerComentariosDeEvento().subscribe(rtdo => {
      this.eventoService.comentarios = rtdo.comentarios.reverse();
      this.actualizarPermisos();
    });
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

  getImage(imgUrl) {
    return `${environment.apiUrl}/evento/imagenes?imgUrl=${imgUrl}`;
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
    if (!this.descripcionComentario || !this.descripcionComentario.trim()) {
      this.snackBar.open("El comentario esta vacío", "", {
        duration: 4500,
        panelClass: ["snack-bar-fracaso"]
      });
    } else {
      const comentario: Comentario = {
        idUsuario: null,
        comentario: descripcion,
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
        .subscribe(rtdo => {
          if (rtdo.exito) {
            this.snackBar.open(rtdo.message, "", {
              duration: 4500,
              panelClass: ["snack-bar-exito"]
            });
            this.descripcionComentario = "";
            this.eventoService.obtenerComentariosDeEvento().subscribe(rtdo => {
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
    this.eventoService.eliminarComentario(idComentario).subscribe(response => {
      if (response.exito) {
        this.snackBar.open(response.message, "", {
          panelClass: ["snack-bar-exito"],
          duration: 4500
        });
      }
      this.eventoService.obtenerComentariosDeEvento().subscribe(rtdo => {
        this.eventoService.comentarios = rtdo.comentarios.reverse();
        console.log(this.eventoService.comentarios);
      });
    });
  }

  onReportar(): void {}
}
