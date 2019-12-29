import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatTooltipDefaultOptions } from "@angular/material";
import { Evento } from "./registrar-evento/evento.model";

@Injectable({
  providedIn: "root"
})
export class EventosService {
  public registrarEvento(
    titulo: string,
    descripcion: string,
    fechaEvento: Date,
    horaInicio: string,
    horaFin: string,
    tags: any[],
    imgUrl: any
  ) {
    const evento: Evento = {
      _id: null,
      titulo,
      descripcion,
      fechaEvento,
      horaInicio,
      horaFin
      imgUrl
    };

  }
}
