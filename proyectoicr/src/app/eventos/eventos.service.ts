import { AutenticacionService } from "src/app/login/autenticacionService.service";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Evento } from "./evento.model";

@Injectable({
  providedIn: "root"
})
export class EventosService {
  constructor(
    public http: HttpClient,
    public authService: AutenticacionService
  ) {}

  eventoSeleccionado: Evento;

  //Registra el evento en la base de datos
  //@params: evento a publicar
  public registrarEvento(
    titulo: string,
    descripcion: string,
    fechaEvento: string,
    horaInicio: string,
    horaFin: string,
    tags: any[],
    image: File
  ) {
    let imgName = image[0].name;
    const datosEvento = new FormData();
    datosEvento.append("image", image[0], imgName);
    datosEvento.append("titulo", titulo);
    datosEvento.append("descripcion", descripcion);
    datosEvento.append("fechaEvento", fechaEvento);
    datosEvento.append("horaInicio", horaInicio);
    datosEvento.append("horaFin", horaFin);
    datosEvento.append("imgUrl", imgName);
    for (var i = 0; i < tags.length; i++) {
      datosEvento.append("tags", tags[i]);
    }
    const autor = this.authService.getUsuarioAutenticado();
    datosEvento.append("autor", autor);

    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/evento/registrar",
      datosEvento
    );
  }

  public obtenerEvento() {
    return this.http.get<{ eventos: Evento[]; message: string; exito: string }>(
      environment.apiUrl + "/evento"
    );
  }

  public publicarComentario(comentario, emailUsuario, rol) {
    const idEvento = this.eventoSeleccionado._id;
    const datosComentario = {
      comentario: comentario,
      emailUsuario: emailUsuario,
      rol: rol,
      idEvento: idEvento
    };
    console.log("llego al servicio");
    return this.http.post<{
      message: string;
      exito: boolean;
      nombre: string;
      apellido: string;
    }>(environment.apiUrl + "/evento/registrarComentario", datosComentario);
  }
}
