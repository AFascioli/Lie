import { environment } from "../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";
@Injectable({
  providedIn: "root",
})
export class CicloLectivoService implements OnDestroy {
  private unsubscribe: Subject<void> = new Subject();
  retornoDesdeAcciones: boolean;
  busquedaARXNombre: boolean;

  constructor(public http: HttpClient) {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  //Obtiene el estado actual del ciclo lectivo
  obtenerEstadoCicloLectivo() {
    return this.http.get<{
      exito: boolean;
      message: string;
      estadoCiclo: string;
    }>(`${environment.apiUrl}/cicloLectivo/estado`);
  }

  inicioCursado() {
    return this.http.get<{
      exito: boolean;
      message: string;
    }>(`${environment.apiUrl}/cicloLectivo/inicioCursado`);
  }

  obtenerParametrosCicloLectivo() {
    return this.http.get<{
      exito: boolean;
      message: string;
      cicloLectivo: any;
    }>(`${environment.apiUrl}/cicloLectivo/parametros`);
  }

  obtenerFaltasSuspensionCicloLectivo() {
    return this.http.get<{
      exito: boolean;
      message: string;
      faltas: any;
    }>(`${environment.apiUrl}/cicloLectivo/cantidadFaltasSuspension`);
  }

  obtenerHoraLlegadaTarde() {
    return this.http.get<{
      exito: boolean;
      message: string;
      hora: any;
    }>(`${environment.apiUrl}/cicloLectivo/horaLlegadaTarde`);
  }

  obtenerHoraRetiroAnticipado() {
    return this.http.get<{
      exito: boolean;
      message: string;
      hora: any;
    }>(`${environment.apiUrl}/cicloLectivo/horaRetiroAnticipado`);
  }

  obtenerMateriasParaInscripcionLibre() {
    return this.http.get<{
      exito: boolean;
      message: string;
      materias: any;
    }>(`${environment.apiUrl}/cicloLectivo/materiasParaLibre`);
  }

  guardarParametros(
    cantidadFaltasSuspension,
    cantidadMateriasInscripcionLibre,
    horaLlegadaTarde,
    horaRetiroAnticipado
  ) {
    let cicloLectivo = {
      cantidadFaltasSuspension: cantidadFaltasSuspension,
      cantidadMateriasInscripcionLibre: cantidadMateriasInscripcionLibre,
      horaLlegadaTarde: horaLlegadaTarde,
      horaRetiroAnticipado: horaRetiroAnticipado,
    };
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/cicloLectivo/parametros",
      cicloLectivo
    );
  }

  validarRegistrarAgenda() {
    return this.http.get<{
      permiso: boolean;
      message: string;
    }>(`${environment.apiUrl}/cicloLectivo/registrarAgenda`);
  }

  validarEnCursado() {
    return this.http.get<{
      permiso: boolean;
      message: string;
    }>(`${environment.apiUrl}/cicloLectivo/periodoCursado`);
  }

  cierreEtapaExamenes() {
    return this.http.get<{
      exito: boolean;
      message: string;
    }>(`${environment.apiUrl}/cicloLectivo/cierreExamenes`);
  }

  cierreTrimestre(trimestre) {
    return this.http.post<{
      exito: boolean;
      message: string;
      materiasSinCerrar: [any];
    }>(`${environment.apiUrl}/cicloLectivo/cierreTrimestre`, {trimestre: trimestre});
  }
  obtenerAniosCicloLectivoActualYPrevios()
  {
    return this.http.get<{
      exito: boolean;
      message: string;
      respuesta: any;
    }>(`${environment.apiUrl}/cicloLectivo/aniosActualYPrevios`);

  }
  }
