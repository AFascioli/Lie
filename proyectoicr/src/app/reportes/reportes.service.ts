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
    return this.http.get<{ eventos: any[]; exito: boolean; message: string }>(
      environment.apiUrl + "/reporte/documentos",
      { params: params }
    );
  }
}
