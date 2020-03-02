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

  //Regista la agenda de un curso
  //@params: id del curso
  //@params: agenda del curso (dia, hora inicio y hora fin)
  public registrarAgenda(agenda: any[], curso: string) {
    return this.http.post<{ exito: boolean; mensaje: string }>(
      environment.apiUrl + "/curso/agenda",
      { agenda: agenda, idCurso: curso }
    );
  }

  //Regista la agenda de un curso
  //@params: id del curso
  public obtenerAgendaDeCurso(idCurso) {
    let params = new HttpParams().set("idCurso", idCurso);
    return this.http.get<{
      message: string;
      exito: boolean;
      agenda: any[];
    }>(environment.apiUrl + "/curso/agenda", {
      params: params
    });
  }

  //Elimina ciertos horarios registrados para un curso y una materia
  //@params: id del curso
  //@params: id horario
  //@params: nombre de la materia
  public eliminarHorarios(idCurso, idHorario, nombreMateria) {
    return this.http.post<{ exito: boolean; message: string }>(
      environment.apiUrl + "/curso/eliminarHorarios",
      {
        idCurso: idCurso,
        idHorario: idHorario,
        nombreMateria: nombreMateria
      }
    );
  }
}
