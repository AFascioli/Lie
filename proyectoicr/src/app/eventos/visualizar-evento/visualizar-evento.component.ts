import { MatSnackBar } from "@angular/material";
import { AutenticacionService } from "src/app/login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { EventosService } from "../eventos.service";
import { Evento } from "../evento.model";
import { Comentario } from "../comentario.model";
import { Router } from "@angular/router";
import { environment } from 'src/environments/environment';
declare var require: any;

@Component({
  selector: "app-visualizar-evento",
  templateUrl: "./visualizar-evento.component.html",
  styleUrls: ["./visualizar-evento.component.css"]
})
export class VisualizarEventoComponent implements OnInit {
  evento: Evento;
  comentarios: any[];
  descripcionComentario: string;

  constructor(
    public eventoService: EventosService,
    public autenticacionService: AutenticacionService,
    public snackBar: MatSnackBar,
    public router: Router
  ) {}

  ngOnInit() {
    if (this.eventoService.eventoSeleccionado == null) {
      this.router.navigate(["/home"]);
    }
    this.evento = this.eventoService.eventoSeleccionado;
    this.eventoService.obtenerComentariosDeEvento().subscribe(rtdo => {
      this.comentarios = rtdo.comentarios.reverse();
    });
  }
 
  getImage(imgUrl) {
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

  onGuardar(descripcion) {
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
            this.comentarios = rtdo.comentarios.reverse();
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
