import { Injectable } from "@angular/core";
import { Estudiante } from "src/app/estudiantes/estudiante.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { EstudiantesService } from "../estudiantes/estudiante.service";

@Injectable({
  providedIn: "root"
})
export class CuotasService {
  estudianteSeleccionado: Estudiante;

  constructor(public http: HttpClient) {

  }

  //Obtiene el estado de las cuotas de todos los estudiantes de un curso en la base de datos
  //@params: id del curso
  //@params: mes de la cuota
  public obtenerEstadoCuotasDeCurso(idCurso: string, mes: Number) {
    let params = new HttpParams().set("idCurso", idCurso).set("mes", mes.toString());
    return this.http.get<{ message: any; exito: boolean; cuotasXEstudiante: any;  }>(
      environment.apiUrl + "/curso/estadoCuotas",
      { params: params }
    );
  }
}
