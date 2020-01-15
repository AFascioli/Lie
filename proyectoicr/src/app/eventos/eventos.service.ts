import { async } from "@angular/core/testing";
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

  constructor(
    public http: HttpClient,
    public authService: AutenticacionService
  ) {}

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
  // Me retorna todos los estudiantes cuyo nombre y apellido coinciden con los pasados por parámetro
  // @params: titulo del evento
  public buscarEvento(titulo: string) {
    let params = new HttpParams().set("titulo", titulo);
    return this.http.get<{ evento: Evento }>(
      environment.apiUrl + "/evento/verEvento",
      { params: params }
    );
  }
}
