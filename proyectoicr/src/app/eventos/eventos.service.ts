import { MatSnackBar } from "@angular/material";
import { Comentario } from "./comentario.model";
import { AutenticacionService } from "src/app/login/autenticacionService.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Evento } from "./evento.model";

@Injectable({
  providedIn: "root"
})
export class EventosService {
  public evento: Evento;
  public tituloABorrar: string;

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

  //Modifica el evento en la base de datos
  public ModificarEvento(
    _id: string,
    titulo: string,
    descripcion: string,
    fechaEvento: Date,
    horaInicio: string,
    horaFin: string,
    tags: any[],
    autor: string,
    imgUrl: any,
    comentarios: any[]
  ) {
    const eventoModificado: Evento = {
      _id,
      titulo,
      descripcion,
      fechaEvento,
      horaInicio,
      horaFin,
      tags,
      autor,
      imgUrl,
      comentarios
    };
    return this.http.patch<{ message: string; exito: boolean }>(
      environment.apiUrl + "/evento/editar",
      eventoModificado
    );
  }
  // Me retorna todos los estudiantes cuyo nombre y apellido coinciden con los pasados por parámetro
  // @params: titulo del evento
  public buscarEvento(titulo: string) {
    let params = new HttpParams().set("titulo", titulo);
    return this.http.get<{ evento: Evento }>(
      environment.apiUrl + "/evento/verEvento",
      { params: params }
    );
  }

  public eliminarEvento(titulo: string) {
    let params = new HttpParams().set("titulo", titulo);
    this.http
      .delete<{ message: string; exito: boolean }>(
        environment.apiUrl + "/evento/eliminarEvento",
        { params: params }
      )
      .subscribe(response => {
        if (response.exito) {
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500
          });
        }
      });
  }
  //Obtiene todos los eventos que estan almacenados en la base de datos
  public obtenerEvento() {
    return this.http.get<{ eventos: Evento[]; message: string; exito: string }>(
      environment.apiUrl + "/evento"
    );
  }

  //Obtiene todos los comentarios de un evento que estan almacenados en la base de datos
  //@params: id del evento
  public obtenerComentariosDeEvento() {
    let params = new HttpParams().set("idEvento", this.eventoSeleccionado._id);
    return this.http.get<{
      comentarios: Comentario[];
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
      idEvento: idEvento
    };

    return this.http.post<{
      message: string;
      exito: boolean;
      nombre: string;
      apellido: string;
    }>(environment.apiUrl + "/evento/registrarComentario", datosComentario);
  }
}
