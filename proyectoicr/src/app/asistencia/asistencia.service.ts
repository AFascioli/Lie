import { Injectable } from "@angular/core";
import { Estudiante } from "src/app/estudiantes/estudiante.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { EstudiantesService } from "../estudiantes/estudiante.service";

@Injectable({
  providedIn: "root",
})
export class AsistenciaService {
  estudianteSeleccionado: Estudiante;

  constructor(public http: HttpClient) {}

  //Obtiene la asistencia para el dia actual de todos los estudiantes de un curso en la base de datos
  //@params: id del curso
  public cargarAsistencia(curso: string) {
    let params = new HttpParams().set("curso", curso);
    return this.http.get<{ estudiantes: any[]; asistenciaNueva: string }>(
      environment.apiUrl + "/asistencia",
      { params: params }
    );
  }
  //Justifica las inasistencias de un estudiante seleccionado
  //@params: id del estudiante
  //@params: ultimas 5 inasistencias, cuyo valor va a ser true en caso de haber sido justificadas
  public justificarInasistencia(ultimasInasistencias: any[]) {
    let datosInasistencia = {
      ultimasInasistencias: ultimasInasistencias,
      idEstudiante: this.estudianteSeleccionado._id,
    };
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/asistencia/inasistencia/justificada",
      datosInasistencia
    );
  }
  //Obtiene la cantidad de inasistencias injustificadas y justificadas de un estudiante determinado
  //@params: id del estudiante
  public obtenerInasistenciasDeEstudiante() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.estudianteSeleccionado._id
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      contadorInasistenciasInjustificada: number;
      contadorInasistenciasJustificada: number;
    }>(environment.apiUrl + "/asistencia/asistenciaEstudiante", {
      params: params,
    });
  }
  //Obtiene las ultimas 5 inasistencias de un estudiante determinado
  //@params: id del estudiante
  public obtenerUltimasInasistencias() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.estudianteSeleccionado._id
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      inasistencias: any[];
    }>(environment.apiUrl + "/asistencia/inasistencias", {
      params: params,
    });
  }
  //Registra la asistencia diaria de todos los estudiantes de un curso en la base de datos
  //@params: los estudiantes que pertenecen al curso seleccionado
  //@params: presentismo del dia actual, true en caso de que el estudiante haya ido a clases ese dia
  public registrarAsistencia(
    estudiantesXDivision: any[],
    asistenciaNueva: string
  ) {
    let params = new HttpParams().set("asistenciaNueva", asistenciaNueva);
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/asistencia",
      estudiantesXDivision,
      { params: params }
    );
  }
  //Registra la llegada tarde y el tipo para que se aplique la inasistencia correspondiente
  //@params: booleano: si es true el estudiante llegó tarde pero antes de las 8 am
  //@params: id del estudiante
  public registrarLlegadaTarde(antes8am) {
    let datosLlegadaTarde = {
      antes8am: antes8am,
      idEstudiante: this.estudianteSeleccionado._id,
    };
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/asistencia/llegadaTarde",
      datosLlegadaTarde
    );
  }

  //Registra el retiro anticipado y el tipo para que se aplique la inasistencia correspondiente
  //@params: booleano: si es true el estudiante se retiró antes de las 10 am
  //@params: id del estudiante
  //@params:
  public registrarRetiroAnticipado(
    idEstudiante: string,
    antes10am: Boolean,
    tutoresSeleccionados: Array<any>
  ) {
    return this.http.post<{ message: string; exito: string }>(
      environment.apiUrl + "/asistencia/retiro",
      {
        idEstudiante: idEstudiante,
        antes10am: antes10am,
        tutoresSeleccionados: tutoresSeleccionados,
      }
    );
  }

  // public resetearInasistenciasPorReincorporación(idEstudiante: string) {
  //   console.log(idEstudiante);
  //   return this.http.post<{ message: string; exito: boolean }>(
  //     environment.apiUrl + "/asistencia/resetearAsistencias",
  //     {  idEstudiante: idEstudiante }
  //   );
  // }
}
