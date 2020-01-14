import { AutenticacionService } from "src/app/login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { EventosService } from "../eventos.service";
import { Evento } from "../evento.model";
import { Comentario } from "../comentario.model";
declare var require: any;

@Component({
  selector: "app-visualizar-evento",
  templateUrl: "./visualizar-evento.component.html",
  styleUrls: ["./visualizar-evento.component.css"]
})
export class VisualizarEventoComponent implements OnInit {
  evento: Evento;

  constructor(
    public eventoService: EventosService,
    public autenticacionService: AutenticacionService
  ) {}

  ngOnInit() {
    this.evento = this.eventoService.eventoSeleccionado;
  }

  getImage(imgUrl) {
    return require("backend/images/" + imgUrl);
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
    this.eventoService.publicarComentario(
      comentario,
      this.autenticacionService.getUsuarioAutenticado(),
      this.autenticacionService.getRol()
    ).subscribe(rtdo => {
      console.log(rtdo);
    })
  }

}
