// import { environment } from "./../../environments/environment.prod";
import { MatSnackBar } from "@angular/material";
import { Comentario } from "./comentario.model";
import { AutenticacionService } from "src/app/login/autenticacionService.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Evento } from "./evento.model";

@Injectable({
  providedIn: "root",
})
export class EventosService {
  public evento: Evento;
  public tituloABorrar: string;
  public comentarios: any[] = [];
  public ImgCargada: string;
  public imageOnly: boolean;
  public anioSeleccionadoEvento: number;

  constructor(
    public snackBar: MatSnackBar,
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
    images: any
  ) {
    const datosEvento = new FormData();
    datosEvento.append("titulo", titulo);
    datosEvento.append("descripcion", descripcion);
    datosEvento.append("fechaEvento", fechaEvento);
    datosEvento.append("horaInicio", horaInicio);
    datosEvento.append("horaFin", horaFin);
    if (images.length != 0) {
      for (var i = 0; i < images.length; i++) {
        datosEvento.append("images", images[i]);
      }
    } else {
      datosEvento.append("images", null);
      datosEvento.append("imgUrl", null);
    }

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

  //Modifica el evento en la base de datos
  public modificarEvento(
    titulo: string,
    descripcion: string,
    fechaEvento: Date,
    horaInicio: string,
    horaFin: string,
    tags: any[],
    images: any,
    filenames: string[],
    _id: string,
    autor: string,
    filenamesBorrados: string[]
  ) {
    let eventoModificado = new FormData();
    const fechaEventoString = fechaEvento.toString();
    eventoModificado.append("_id", _id);
    eventoModificado.append("titulo", titulo);
    eventoModificado.append("descripcion", descripcion);
    eventoModificado.append("fechaEvento", fechaEventoString);
    eventoModificado.append("horaInicio", horaInicio);
    eventoModificado.append("horaFin", horaFin);

    if (filenames.length != 0) {
      for (var i = 0; i < filenames.length; i++) {
        eventoModificado.append("filenames", filenames[i]);
      }
    }

    if (images.length != 0) {
      for (var i = 0; i < images.length; i++) {
        eventoModificado.append("images", images[i]);
      }
    } else {
      eventoModificado.append("images", null);
      eventoModificado.append("imgUrl", null);
    }

    for (var i = 0; i < tags.length; i++) {
      eventoModificado.append("tags", tags[i]);
    }
    eventoModificado.append("idAutor", autor);

    if (filenamesBorrados.length != 0) {
      for (var i = 0; i < filenamesBorrados.length; i++) {
        eventoModificado.append("filenamesBorrados", filenamesBorrados[i]);
      }
    } else {
      eventoModificado.append("filenamesBorrados", null);
    }

    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/evento/modificar",
      eventoModificado
    );
  }
  // Me retorna todos los estudiantes cuyo nombre y apellido coinciden con los pasados por parámetro
  // @params: titulo del evento
  public buscarEvento(_id) {
    let params = new HttpParams().set("_id", _id);
    return this.http.get<{ evento: Evento }>(
      environment.apiUrl + "/evento/verEvento",
      { params: params }
    );
  }

  public eliminarEvento(_id) {
    let params = new HttpParams().set("_id", _id);
    return this.http.delete<{ message: string; exito: boolean }>(
      environment.apiUrl + "/evento/eliminarEvento",
      { params: params }
    );
  }

  //Obtiene todos los eventos que estan almacenados en la base de datos
  public obtenerEvento() {
    return this.http.get<{ eventos: Evento[]; message: string; exito: string }>(
      environment.apiUrl + "/evento"
    );
  }

  //Obtiene la imagen de un evento dada su url
  public obtenerImagenEvento(imgUrl: string) {
    let params = new HttpParams().set("imgUrl", imgUrl);
    return this.http.get<File>(environment.apiUrl + "/evento/imagenes", {
      params: params,
    });
  }

  //Obtiene todos los comentarios de un evento que estan almacenados en la base de datos
  //@params: id del evento
  public obtenerComentariosDeEvento() {
    let params = new HttpParams().set("idEvento", this.eventoSeleccionado._id);
    return this.http.get<{
      comentarios: any[];
      message: string;
      exito: string;
    }>(environment.apiUrl + "/evento/comentarios", { params: params });
  }

  //Publica en la base de datos un comentario
  //@params: id del evento
  //@params: la descripcion del comentario, el autor junto con el rol que cumple
  public publicarComentario(comentario, emailUsuario, rol) {
    const idEvento = this.eventoSeleccionado._id;
    const datosComentario = {
      comentario: comentario,
      emailUsuario: emailUsuario,
      rol: rol,
      idEvento: idEvento,
    };

    return this.http.post<{
      message: string;
      exito: boolean;
      nombre: string;
      apellido: string;
    }>(environment.apiUrl + "/evento/registrarComentario", datosComentario);
  }

  // Borrar cuando se sepa que no es nada a medio hacer que haya quedado por error
  // public idComentarioSeleccionado: string;
  // public eliminarComentario() {
  //   let params = new HttpParams()
  //     .set("idEvento", this.eventoSeleccionado._id)
  //     .append("idComentario", this.idComentarioSeleccionado);
  //   return this.http.delete<{ message: string; exito: boolean }>(
  //     environment.apiUrl + "/evento/eliminarComentario",
  //     { params: params }
  //   );
  // }

  public eliminarComentariobyID(idComentario) {
    let params = new HttpParams()
      .set("idEvento", this.eventoSeleccionado._id)
      .set("idComentario", idComentario);
    return this.http.delete<{ message: string; exito: boolean }>(
      environment.apiUrl + "/evento/eliminarComentario",
      { params: params }
    );
  }

  public obtenerEventosDeCursos(
    idEstudiantes: any[]
  ) {
    return this.http.post<{ aniosEventos: any[],eventos: any[]; exito: boolean; message: string }>(
      environment.apiUrl + "/evento/curso",
      { idEstudiantes }
    );
  }

  //Dada una id de evento, retorna un evento con todos sus datos
  public obtenerEventoPorId(idEvento: string) {
    let params = new HttpParams().set("idEvento", idEvento);
    return this.http.get<{ evento: Evento; exito: boolean; message: string }>(
      environment.apiUrl + "/evento/id",
      { params: params }
    );
  }
}
