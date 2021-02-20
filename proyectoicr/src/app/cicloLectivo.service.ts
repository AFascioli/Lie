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
  esInicioCursado:boolean;
  private actualizarML = new Subject<any>();

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

   //Obtiene el estado actual del ciclo lectivo
   obtenerEstadoMXC(idCurso, idMateria) {
    let params = new HttpParams().set("idCurso", idCurso).set("idMateria", idMateria);
    return this.http.get<{
      exito: boolean;
      message: string;
      estadoMXC: string;
    }>(`${environment.apiUrl}/cicloLectivo/mxc/estado`, {params:params});
  }

  obtenerEstadoMateriasCursos() {
    return this.http.get<{
      exito: boolean;
      message: string;
      cursosEstados: any[];
    }>(`${environment.apiUrl}/cicloLectivo/curso/materia/estado`);
  }

  inicioCursado() {
    return this.http.get<{
      exito: boolean;
      message: string;
      cursosSinAgenda: any[];
    }>(`${environment.apiUrl}/cicloLectivo/inicioCursado`);
  }

  obtenerParametrosProxCicloLectivo() {
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

  validarModificarAgenda() {
    return this.http.get<{
      puedeModificar: boolean;
      creado: boolean;
      message: string;
    }>(`${environment.apiUrl}/cicloLectivo/modificarAgenda`);
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
    }>(`${environment.apiUrl}/cicloLectivo/cierreTrimestre`, {
      trimestre: trimestre,
    });
  }

  obtenerAniosCicloLectivo() {
    return this.http.get<{
      exito: boolean;
      message: string;
      respuesta: any;
    }>(`${environment.apiUrl}/cicloLectivo/anios`);
  }

  obtenerActualYSiguiente() {
    return this.http.get<{
      exito: boolean;
      message: string;
      añosCiclos: any[];
    }>(`${environment.apiUrl}/cicloLectivo/actualYSiguiente`);
  }

  obtenerActualYAnteriores() {
    return this.http.get<{
      exito: boolean;
      message: string;
      añosCiclos: any[];
    }>(`${environment.apiUrl}/cicloLectivo/actualYAnteriores`);
  }

  // Dispara observable para que cuando se cambia el estado del diclo lectivo se recarge el menu lateral para actualizar
  // las opciones.
  public actualizarMenuLateral() {
        this.actualizarML.next();
  }

  // Usado en el menu lateral para escuchar al publish de arriba.
  public getActualizacionMLListener() {
    return this.actualizarML.asObservable();
  }
}
