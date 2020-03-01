import { environment } from "src/environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class AgendaService {
  constructor(public http: HttpClient) {}

  //Retorna todas las materias de la institucion
  public obtenerMaterias() {
    return this.http.get<{ materias: any[] }>(environment.apiUrl + "/materia");
  }

  //Retorna todos los docentes de la institucion
  public obtenerDocentes() {
    return this.http.get<{ docentes: any[] }>(
      environment.apiUrl + "/empleado/docente"
    );
  }

  public registrarAgenda(agenda: any[], curso: string) {
    return this.http.post<{ exito: boolean; mensaje: string }>(
      environment.apiUrl + "/curso/agenda",
      {agenda: agenda, idCurso: curso}
    );
  }
  public obtenerAgendaDeCurso(idCurso){
    let params = new HttpParams().set(
      "idCurso", idCurso
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      agenda: any[];
    }>(environment.apiUrl + "/curso/agenda", {
      params: params
    });
  }
}
