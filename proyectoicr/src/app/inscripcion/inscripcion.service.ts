import { Injectable } from "@angular/core";
import { Estudiante } from "../estudiantes/estudiante.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class InscripcionService {
  estudianteSeleccionado: Estudiante;

  constructor(public http: HttpClient) {}

  //Obtiene todos los cursos que están almacenados en la base de datos
  public obtenerCursos(añoLectivo) {
    let params = new HttpParams().set("anioLectivo", añoLectivo);
    return this.http.get<{ cursos: any[] }>(environment.apiUrl + "/curso", {
      params: params,
    });
  }

  //Dado un curso, obtiene todos los estudiantes que se pueden inscribir a ese curso
  //@params: idCurso
  public obtenerEstudiantesInscripcionCurso(idCurso) {
    let params = new HttpParams().set("idCurso", idCurso);
    return this.http.get<{ estudiantes: any[]; exito: boolean }>(
      environment.apiUrl + "/curso/estudiantes/inscripcion",
      { params: params }
    );
  }

  //Dado un curso, obtiene todos los estudiantes que se pueden inscribir a ese curso
  //@params: idCurso
  public obtenerEstudiantesInscripcionCursoProximoAnio(idCurso) {
    let params = new HttpParams().set("idCurso", idCurso);
    return this.http.get<{ estudiantes: any[]; exito: boolean }>(
      environment.apiUrl + "/curso/estudiantes/inscripcionProximoAnio",
      { params: params }
    );
  }

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
        documentosEntregados: documentosEntregados,
      }
    );
  }

  //Validar si el estudiante tiene o no inscripcion pendiente
  //@params: id estudiante que se quiere verificar
  public validarInscripcionPendiente(idEstudiante: string) {
    let params = new HttpParams().set("idEstudiante", idEstudiante);
    return this.http.get<{ inscripcionPendiente: boolean; exito: boolean }>(
      environment.apiUrl + "/curso/estudiante/inscripcionPendiente",
      { params: params }
    );
  }

  //Inscribe a un estudiante a un curso y los documentos entregados durante la inscripción
  //@params: id estudiante que se quiere inscribir
  //@params: id curso al que se lo quiere inscribir
  //@params: array documentos entregados en inscripcion: true si se entregó ese documente
  public inscribirEstudianteProximoAño(idEstudiante: string, idCurso: string) {
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/curso/inscripcionProximoAnio",
      {
        idEstudiante: idEstudiante,
        idCurso: idCurso,
      }
    );
  }

  //Inscribe un conjunto de estudiantes a un curso para el año en curso
  //@params: lista de estudiantes
  //@params: id curso al que se lo quiere inscribir
  public inscribirEstudiantesCurso(estudiantes: any[], idCurso: string) {
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/curso/estudiantes/inscripcion",
      {
        estudiantes: estudiantes,
        idCurso: idCurso,
      }
    );
  }

  //Inscribe un conjunto de estudiantes a un curso para el proximo año
  //@params: lista de estudiantes
  //@params: id curso al que se lo quiere inscribir
  public inscribirEstudiantesCursoProximoAño(
    estudiantes: any[],
    idCurso: string
  ) {
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/curso/estudiantes/inscripcionProximoAnio",
      {
        estudiantes: estudiantes,
        idCurso: idCurso,
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
  //a su estado académico (promovido - libre) y su curso actual
  public obtenerCursosInscripcionEstudiante(añoLectivo: any) {
    let params = new HttpParams()
      .set("idEstudiante", this.estudianteSeleccionado._id)
      .set("añoLectivo", añoLectivo);
    return this.http.get<{
      message: string;
      exito: boolean;
      cursos: any[];
      cursoActual: any;
    }>(environment.apiUrl + "/curso/cursosDeEstudiante", { params: params });
  }
  //Obtiene el estado de los documentos de los estudiantes de un curso determinado
  //el estado es true en el caso de que el documento haya sido entregado
  //@params: id del curso
  public obtenerDocumentosDeEstudiantesXCurso(curso: string) {
    let params = new HttpParams().set("curso", curso);
    return this.http.get<{
      documentos: any[];
      message: string;
      exito: boolean;
    }>(environment.apiUrl + "/curso/documentos", {
      params: params,
    });
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
