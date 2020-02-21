import { Injectable } from "@angular/core";
import { Estudiante } from "src/app/estudiantes/estudiante.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { EstudiantesService } from "../estudiantes/estudiante.service";

@Injectable({
  providedIn: "root"
})
export class AsistenciaService {
  estudianteSeleccionado: Estudiante;

  constructor(public http: HttpClient) {

  }

  //Obtiene el estado de las cuotas de todos los estudiantes de un curso en la base de datos
  //@params: id del curso
  public obtenerEstadoCuotasDeCurso(idCurso: string) {
    let params = new HttpParams().set("idCurso", idCurso);
    return this.http.get<{ estudiantes: any[]; estadoCuotas: string }>(
      environment.apiUrl + "/curso/estadoCuotas",
      { params: params }
    );
  }
}
