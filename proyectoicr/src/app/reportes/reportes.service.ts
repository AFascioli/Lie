import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class ReportesService {
  constructor(public http: HttpClient) {}

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
}
