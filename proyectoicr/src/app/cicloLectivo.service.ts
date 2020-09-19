import { environment } from "../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
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

  guardarParametros(
    cantidadFaltasSuspension,
    cantidadMateriasInscripcionLibre,
    horaLlegadaTardeAntes,
    horaLlegadaTardeDespues,
    horaRetiroAnticipadoAntes,
    horaRetiroAnticipadoDespues
  ) {
    let cicloLectivo = {
      cantidadFaltasSuspension: cantidadFaltasSuspension,
      cantidadMateriasInscripcionLibre: cantidadMateriasInscripcionLibre,
      horaLlegadaTardeAntes: horaLlegadaTardeAntes,
      horaLlegadaTardeDespues: horaLlegadaTardeDespues,
      horaRetiroAnticipadoAntes: horaRetiroAnticipadoAntes,
      horaRetiroAnticipadoDespues: horaRetiroAnticipadoDespues,
    };
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/cicloLectivo/parametros",
      cicloLectivo
    );
  }
}
