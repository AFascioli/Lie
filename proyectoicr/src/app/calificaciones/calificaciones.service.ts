import { Injectable } from "@angular/core";
import { Estudiante } from "../estudiantes/estudiante.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class CalificacionesService {
  estudianteSeleccionado: Estudiante;

  constructor(public http: HttpClient) {}

  //Obtiene las calificaciones de un estudiante para una materia y un trimestre determinado
  //@params: id del estudiante
  //@params: trimestre: 1,2 o 3
  public obtenerCalificacionesXMateriaXEstudiante(trimestre: string) {
    let params = new HttpParams()
      .set("idEstudiante", this.estudianteSeleccionado._id)
      .set("trimestre", trimestre);
    return this.http.get<{
      message: string;
      exito: boolean;
      vectorCalXMat: any[];
    }>(environment.apiUrl + "/calificacion/materia/calificaciones", {
      params: params
    });
  }

  //Obtiene todas las calificaciones de los estudiantes de un curso determinado
  //para un trimestre dado
  //@params: id del curso
  //@params: id de la materia
  //@params: trimestre (1,2 o 3)
  public obtenerCalificacionesEstudiantesXCursoXMateria(
    idCurso: string,
    idMateria: string,
    trimestre: string
  ) {
    let params = new HttpParams()
      .set("idCurso", idCurso)
      .set("idMateria", idMateria)
      .set("trimestre", trimestre);
    return this.http.get<{
      estudiantes: any[];
      message: string;
      exito: boolean;
    }>(environment.apiUrl + "/curso/estudiantes/materias/calificaciones", {
      params: params
    });
  }

   //Obtiene todas las calificaciones de los estudiantes de un curso determinado
  //@params: id del curso
  //@params: id de la materia
  public obtenerCalificacionesEstudiantesXCursoXMateriaCicloLectivo(
    idCurso: string,
    idMateria: string
  ) {
    let params = new HttpParams()
      .set("idCurso", idCurso)
      .set("idMateria", idMateria)
    return this.http.get<{
      estudiantes: any[];
      message: string;
      exito: boolean;
    }>(environment.apiUrl + "/curso/estudiantes/materias/calificacionesCicloLectivo", {
      params: params
    });
  }

  //Obtiene las materias desaprobadas de un estudiante determinado
  //@params: id del estudiante
  public obtenerMateriasDesaprobadasEstudiante(idEstudiante: string) {
    let params = new HttpParams().set(
      "idEstudiante",
      idEstudiante
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      materiasDesaprobadas: any[];
    }>(environment.apiUrl + "/calificacion/materiasDesaprobadas", {
      params: params
    });
  }

  //Registra las calificaciones todos los estudiantes de un curso para una materia
  //y un trimestre determinado en la base de datos
  //@params: id de la materia
  //@params: trimestre (1,2 o 3)
  public registrarCalificaciones(
    estudiantes: any[],
    idMateria: string,
    trimestre: string
  ) {
    let params = new HttpParams()
      .set("idMateria", idMateria)
      .set("trimestre", trimestre);
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/curso/estudiantes/materias/calificaciones",
      estudiantes,
      { params: params }
    );
  }

  //Registra las calificacion de examen y se la asigna al promedio final de la materia
  //@params: id de la materia
  //@params: id del estudiante
  //@params: trimestre (1,2 o 3)
  public registrarCalificacionExamen(idMateria, calificacion) {
    let datosExamen = {
      idMateria: idMateria,
      idEstudiante: this.estudianteSeleccionado._id,
      calificacion: calificacion
    };
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/calificacion/examen",
      datosExamen
    );
  }
}
