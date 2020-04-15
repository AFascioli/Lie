import { Injectable, OnDestroy } from "@angular/core";
import { environment } from "./../../environments/environment";
import { Estudiante } from "./estudiante.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class EstudiantesService implements OnDestroy {
  estudiantes: Estudiante[] = [];
  divisionesXAño: any[];
  estudiantesXDivision: any[];
  private estudiantesXDivisionActualizados = new Subject<any[]>();
  estudiantesBuscados = new Subject<Estudiante[]>();
  private divisionXCursoActualizada = new Subject<any[]>();
  estudianteSeleccionado: Estudiante;
  retornoDesdeAcciones: Boolean;
  busquedaEstudianteXNombre: boolean;
  private unsubscribe: Subject<void> = new Subject();

  constructor(public http: HttpClient) {
    this.retornoDesdeAcciones = false;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  //Registra en la base de datos un nuevo estudiante con todos sus datos
  //@params: datos del estudiante
  public altaEstudiante(
    apellido: string,
    nombre: string,
    tipoDocumento: string,
    numeroDocumento: number,
    cuil: number,
    sexo: string,
    calle: string,
    numeroCalle: number,
    piso: string,
    departamento: string,
    provincia: string,
    localidad: string,
    codigoPostal: number,
    nacionalidad: string,
    fechaNacimiento: string,
    estadoCivil: string,
    telefonoFijo: number
  ) {
    const estudiante: Estudiante = {
      _id: null,
      apellido,
      nombre,
      tipoDocumento,
      numeroDocumento,
      cuil,
      sexo,
      calle,
      numeroCalle,
      piso,
      departamento,
      provincia,
      localidad,
      codigoPostal,
      nacionalidad,
      fechaNacimiento,
      estadoCivil,
      telefonoFijo
    };
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/estudiante",
      estudiante
    );
  }

  //Realiza el borrado lógico de un estudiante cuyo id se pasa por parametro
  //@params: id del estudiante
  public borrarEstudiante(_id) {
    let params = new HttpParams().set("_id", _id);
    return this.http.delete<{ message: string; exito: boolean }>(
      environment.apiUrl + "/estudiante/borrar",
      {
        params: params
      }
    );
  }

  //Me retorna todos los estudiantes cuyo tipo y numero de documento coinciden con los pasados por parámetro
  //@params: tipo de documento del estudiante
  //@params: número de documento del estudiante
  public buscarEstudiantesDocumento(tipo: string, numero: number) {
    let params = new HttpParams()
      .set("tipo", tipo)
      .set("numero", numero.toString());
    this.http
      .get<{ estudiantes: Estudiante[] }>(
        environment.apiUrl + "/estudiante/documento",
        { params: params }
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(response => {
        this.estudiantes = response.estudiantes;
        this.estudiantesBuscados.next([...this.estudiantes]);
      });
  }

  //Me retorna todos los estudiantes cuyo nombre y apellido coinciden con los pasados por parámetro
  //@params: nombre del estudiante
  //@params: apellido del estudiante
  public buscarEstudiantesNombreApellido(nombre: string, apellido: string) {
    let params = new HttpParams()
      .set("nombre", nombre)
      .set("apellido", apellido);
    this.http
      .get<{ estudiantes: Estudiante[] }>(
        environment.apiUrl + "/estudiante/nombreyapellido",
        { params: params }
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(response => {
        this.estudiantes = response.estudiantes;
        this.estudiantesBuscados.next([...this.estudiantes]);
      });
  }

  //Devuelve un booleano que resulta verdadero en el caso de que el estudiante ya se encuentra inscripto a un curso
  //@params: id del estudiante
  public estudianteEstaInscripto(idEstudiante: string) {
    let params = new HttpParams().set("idEstudiante", idEstudiante);
    return this.http.get<{ message: string; exito: boolean }>(
      environment.apiUrl + "/estudiante/curso",
      { params: params }
    );
  }

  public getDivisionXAñoListener() {
    return this.divisionXCursoActualizada.asObservable();
  }

  public getEstudiantesListener() {
    return this.estudiantesBuscados.asObservable();
  }

  public getEstudiantesXDivisionListener() {
    return this.estudiantesXDivisionActualizados.asObservable();
  }

  //Obtiene todas las cuotas de un estudiante pasado por parámetro
  //@params: id del estudiante
  public getCuotasDeEstudiante() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.estudianteSeleccionado._id
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      cuotas: any[];
    }>(environment.apiUrl + "/estudiante/cuotasEstudiante", {
      params: params
    });
  }

  //Obtiene todas las sanciones del estudiante seleccionado
  public getSancionesDeEstudiante() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.estudianteSeleccionado._id
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      sanciones: any[];
    }>(environment.apiUrl + "/estudiante/sancionesEstudiante", {
      params: params
    });
  }
  //Obtiene todos los tutores (tutores y adultos responsables) de un estudiante pasado por parámetro
  //@params: id del estudiante
  public getTutoresDeEstudiante() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.estudianteSeleccionado._id
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      tutores: any[];
    }>(environment.apiUrl + "/estudiante/adultosResponsables", {
      params: params
    });
  }

  //Modifica en la base de datos los datos de un estudiante seleccionado
  //@params: datos del estudiante
  public modificarEstudiante(
    _id: string,
    apellido: string,
    nombre: string,
    tipoDocumento: string,
    numeroDocumento: number,
    cuil: number,
    sexo: string,
    calle: string,
    numeroCalle: number,
    piso: string,
    departamento: string,
    provincia: string,
    localidad: string,
    codigoPostal: number,
    nacionalidad: string,
    fechaNacimiento: string,
    estadoCivil: string,
    telefonoFijo: number
  ) {
    const estudianteModificado: Estudiante = {
      _id,
      apellido,
      nombre,
      tipoDocumento,
      numeroDocumento,
      cuil,
      sexo,
      calle,
      numeroCalle,
      piso,
      departamento,
      provincia,
      localidad,
      codigoPostal,
      nacionalidad,
      fechaNacimiento,
      estadoCivil,
      telefonoFijo
    };
    return this.http.patch<{ message: string; exito: boolean }>(
      environment.apiUrl + "/estudiante/modificar",
      estudianteModificado
    );
  }

  //Obtiene todos los cursos que están almacenados en la base de datos
  public obtenerCursos() {
    return this.http.get<{ cursos: any[] }>(environment.apiUrl + "/curso");
  }

  //Obtiene todos los cursos que son dictados por una docente
  //@params: id de la docente
  public obtenerCursosDeDocente(idDocente: string) {
    let params = new HttpParams().set("idDocente", idDocente);
    return this.http.get<{ cursos: any[]; message: string; exito: boolean }>(
      environment.apiUrl + "/curso/docente",
      { params: params }
    );
  }

  //Obtiene todas las materias que son dictadas por una docente en un curso determinado
  //@params: id de la docente
  //@params: id del curso
  public obtenerMateriasXCursoXDocente(idcurso, idDocente) {
    let params = new HttpParams()
      .set("idCurso", idcurso)
      .set("idDocente", idDocente);
    return this.http.get<{ materias: any[]; message: string; exito: true }>(
      environment.apiUrl + "/curso/materias",
      { params: params }
    );
  }

  //Obtiene todas las materias que son dictadas para un curso determinado
  //@params: id del curso
  public obtenerMateriasDeCurso(idcurso) {
    let params = new HttpParams().set("idCurso", idcurso);
    return this.http.get<{ materias: any[]; exito: boolean; message: string }>(
      environment.apiUrl + "/curso/materiasDeCurso",
      { params: params }
    );
  }

  //Obtiene el curso al que se encuentra inscripto el estudiante
  public obtenerCursoDeEstudiante() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.estudianteSeleccionado._id
    );

    return this.http.get<{
      message: string;
      exito: boolean;
      curso: string;
      idCurso: string;
    }>(environment.apiUrl + "/curso/estudiante", {
      params: params
    });
  }

  //Obtiene el nombre del curso al que se encuentra inscripto el estudiante
  //@params: id del estudiante
  public obtenerCursoDeEstudianteById(idEstudiante) {
    let params = new HttpParams().set("idEstudiante", idEstudiante);

    return this.http.get<{
      message: string;
      exito: boolean;
      curso: string;
      idCurso: string;
    }>(environment.apiUrl + "/curso/estudiante", {
      params: params
    });
  }

  //Obtiene un estudiante dada su id
  //@params: id del estudiante
  public obtenerEstudiantePorId(idEstudiante: string) {
    let params = new HttpParams().set("idEstudiante", idEstudiante);
    return this.http.get<{
      estudiante: Estudiante;
      exito: boolean;
      message: string;
    }>(environment.apiUrl + "/estudiante/id", { params: params });
  }
}
