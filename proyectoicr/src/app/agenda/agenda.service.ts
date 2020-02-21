import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class AgendaService {
  constructor(public http: HttpClient) {}

  //Retorna todas las materias de la institucion
  public obtenerMaterias() {
    //return this.http.get<{ materias: any[] }>(environment.apiUrl + "/materia");

    var materiaObj = {
      nombre: "Matemática",
      dia: "Miercoles",
      inicio: "10:30",
      fin: "11:15"
    };

    var materiaObj2 = {
      nombre: "Lengua",
      dia: "Miercoles",
      inicio: "08:40",
      fin: "10:10"
    };

    var materiaObj3 = {
      nombre: "Física",
      dia: "Lunes",
      inicio: "07:00",
      fin: "08:30"
    };

    var materiaObj4 = {
      nombre: "Historia",
      dia: "Lunes",
      inicio: "08:40",
      fin: "10:10"
    };

    var materiaObj5 = {
      nombre: "Biología",
      dia: "Jueves",
      inicio: "07:00",
      fin: "08:30"
    };

    var materiaObj7 = {
      nombre: "Biología",
      dia: "Jueves",
      inicio: "08:40",
      fin: "09:25"
    };

    var materiaObj6 = {
      nombre: "Matemática",
      dia: "Viernes",
      inicio: "07:00",
      fin: "08:30"
    };

    return [
      materiaObj,
      materiaObj2,
      materiaObj3,
      materiaObj4,
      materiaObj5,
      materiaObj6,
      materiaObj7
    ];
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
}
