import { AutenticacionService } from 'src/app/login/autenticacionService.service';
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Evento } from "./registrar-evento/evento.model";

@Injectable({
  providedIn: "root"
})
export class EventosService {
  constructor(public http: HttpClient, public authService: AutenticacionService) {}

  //Registra el evento en la base de datos
  //@params: evento a publicar
  public registrarEvento(
    titulo: string,
    descripcion: string,
    fechaEvento: Date,
    horaInicio: string,
    horaFin: string,
    tags: any[],
    imgUrl: any
  ) {
    console.log('se llamo al servicio');
    const autor = this.authService.getUsuarioAutenticado();
    const evento: Evento = {
      _id: null,
      titulo,
      descripcion,
      fechaEvento,
      horaInicio,
      horaFin,
      tags,
      autor,
      imgUrl
    };

    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/evento/registrar",
      evento
    );
  }
}
