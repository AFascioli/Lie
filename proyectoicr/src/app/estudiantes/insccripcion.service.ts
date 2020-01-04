import { Injectable } from "@angular/core";
import { Estudiante } from "./estudiante.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class InscripcionService {
  estudianteSeleccionado: Estudiante;

  constructor(public http: HttpClient) {}

  //Inscribe a un estudiante a un curso y los documentos entregados durante la inscripción
  //@params: id estudiante que se quiere inscribir
  //@params: id curso al que se lo quiere inscribir
  //@params: array documentos entregados en inscripcion: true si se entregó ese documente
  public inscribirEstudiante(
    idEstudiante: string,
    idCurso: string,
    documentosEntregados: any[]
  ) {
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/curso/inscripcion",
      {
        idEstudiante: idEstudiante,
        idCurso: idCurso,
        documentosEntregados: documentosEntregados
      }
    );
  }

  //Obtiene la capacidad de un curso, para evitar que en las inscripción se supere el limite
  //@params: id del curso
  public obtenerCapacidadCurso(idCurso: string) {
    let params = new HttpParams().set("idCurso", idCurso);
    return this.http.get<{
      message: string;
      exito: boolean;
      capacidad: number;
    }>(environment.apiUrl + "/curso/capacidad", { params: params });
  }

  //Obtiene todos los cursos a los que se puede inscribir un estudiante de acuerdo
  //a su estado académico (promovido - libre)
  //@params: id de la docente
  public obtenerCursosInscripcionEstudiante() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.estudianteSeleccionado._id
    );
    return this.http.get<{ message: string; exito: boolean; cursos: any[] }>(
      environment.apiUrl + "/curso/cursosDeEstudiante",
      { params: params }
    );
  }

  //Registra si los documentos fueron entregados o no por los estudiantes de un curso
  //@params: array que contiene los datos del estudiante (apellido, nombre e id), los documentos
  //entregados (entregado: true, en el caso de que se haya entregado)
  public registrarDocumentosInscripcion(estudiantes: any[]) {
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/estudiante/documentos",
      estudiantes
    );
  }
}
