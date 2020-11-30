import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class ReportesService {
  public idEstudianteSeleccionado: string;
  public retornoDeResumenAcademico: boolean;
  public cursoSeleccionado:string;
  public nombreCurso:string;

  constructor(public http: HttpClient) {
    this.retornoDeResumenAcademico = false;
  }

  public obtenerDocsAdeudados(idCurso) {
    let params = new HttpParams().set("idCurso", idCurso);
    return this.http.get<{
      exito: boolean;
      message: string;
      estudiantesXDocs: any[];
    }>(environment.apiUrl + "/reporte/documentos", { params: params });
  }

  public obtenerCuotasAdeudadas(idCurso) {
    let params = new HttpParams().set("idCurso", idCurso);
    return this.http.get<{
      exito: boolean;
      message: string;
      estudiantesXCuotas: any[];
    }>(environment.apiUrl + "/reporte/cuotas", { params: params });
  }

  public obtenerEstudiantesDelCurso(idCurso) {
    let params = new HttpParams().set("idCurso", idCurso);
    return this.http.get<{
      exito: boolean;
      message: string;
      estudiantes: any[];
    }>(environment.apiUrl + "/curso/estudiantes", { params: params });
  }

  public obtenerResumenAcademico(idEstudiante) {
    let params = new HttpParams().set("idEstudiante", idEstudiante);
    return this.http.get<{
      exito: boolean;
      message: string;
      resumen: any[];
    }>(environment.apiUrl + "/reporte/resumenAcademico", { params: params });
  }

}
