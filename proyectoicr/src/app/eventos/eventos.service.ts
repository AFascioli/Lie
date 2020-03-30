// import { environment } from "./../../environments/environment.prod";
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
  public idComentarioSeleccionado: string;
  public comentarios: any[];
  public ImgCargada: string;

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
    image: File,
    comentarios: any[]
  ) {
    let imgUrl = image[0].name;
    const fechaEventoS = fechaEvento.toString();
    const eventoModificado = new FormData();
    eventoModificado.append("_id", _id);
    eventoModificado.append("image", image[0], imgUrl);
    eventoModificado.append("titulo", titulo);
    eventoModificado.append("descripcion", descripcion);
    eventoModificado.append("fechaEvento", fechaEventoS);
    eventoModificado.append("horaInicio", horaInicio);
    eventoModificado.append("horaFin", horaFin);
    eventoModificado.append("imgUrl", imgUrl);
    for (var i = 0; i < tags.length; i++) {
      eventoModificado.append("tags", tags[i]);
    }
    eventoModificado.append("autor", autor);
    for (var i = 0; i < comentarios.length; i++) {
      eventoModificado.append("comentarios", comentarios[i]);
    }
    return this.http.patch<{ message: string; exito: boolean }>(
      environment.apiUrl + "/evento/editar",
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

  //Obtiene la imagen de un evento dada su url
  public obtenerImagenEvento(imgUrl: string) {
    let params = new HttpParams().set("imgUrl", imgUrl);
    return this.http.get<File>(environment.apiUrl + "/evento/imagenes", {
      params: params
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
      idEvento: idEvento
    };

    return this.http.post<{
      message: string;
      exito: boolean;
      nombre: string;
      apellido: string;
    }>(environment.apiUrl + "/evento/registrarComentario", datosComentario);
  }
  public eliminarComentario(id) {
    let params = new HttpParams()
      .set("idEvento", this.eventoSeleccionado._id)
      .append("idComentario", this.idComentarioSeleccionado);
    this.http
      .delete<{ message: string; exito: boolean }>(
        environment.apiUrl + "/evento/eliminarComentario",
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

  public eliminarImagen(imgUrl: string) {
    let params = new HttpParams()
      .set("imgUrl", imgUrl)
      .append("idImg", this.ImgCargada);
    this.http
      .delete<{ message: string; exito: boolean }>(
        environment.apiUrl + "/evento/eliminarImagen",
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

  public obtenerEventosDeCursos(cursos: string) {
    let params = new HttpParams().set("cursos", cursos);
    return this.http.get<{ eventos: any[]; exito: boolean; message: string }>(
      environment.apiUrl + "/evento/curso",
      { params: params }
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
