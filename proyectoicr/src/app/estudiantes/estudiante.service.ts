import { AdultoResponsable } from "./../adulto-responsable/adultoResponsable.model";
import { Injectable } from "@angular/core";
import { Estudiante } from "./estudiante.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Provincia } from "./provincias.model";
import { Subject } from "rxjs";
import { Localidad } from "./localidades.model";
import { Nacionalidad } from "./nacionalidades.model";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class EstudiantesService {
  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  estudiantes: Estudiante[] = [];
  nacionalidades: Nacionalidad[] = [];
  divisionesXAño: any[];
  estudiantesXDivision: any[];
  private provinciasActualizadas = new Subject<Provincia[]>();
  private localidadesActualizadas = new Subject<Localidad[]>();
  private nacionalidadesActualizadas = new Subject<Nacionalidad[]>();
  private estudiantesXDivisionActualizados = new Subject<any[]>();
  estudiantesBuscados = new Subject<Estudiante[]>();
  private divisionXCursoActualizada = new Subject<any[]>();
  formInvalidoEstudiante: Boolean;
  estudianteSeleccionado: Estudiante;
  retornoDesdeAcciones: Boolean;
  tipoPopUp: string;
  formEstudianteModificada: boolean;
  busquedaEstudianteXNombre: boolean;

  constructor(public http: HttpClient) {
    this.retornoDesdeAcciones = false;
  }

  altaEstudiante(
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
    this.http
      .post<{ message: string }>(environment.apiUrl + "/estudiante", estudiante)
      .subscribe(response => {
        console.log(response.message);
      });
  }

  borrarEstudiante(_id) {
    let params = new HttpParams().set("_id", _id);
    this.http
      .delete<{ message: string }>(environment.apiUrl + "/estudiante/borrar", {
        params: params
      })
      .subscribe(response => {
        console.log(response.message);
      });
  }

  getEstudiantesListener() {
    return this.estudiantesBuscados.asObservable();
  }

  // Metodo para obtener un listener, cosa que de los componentes puedan obtener info actualizada
  getProvinciasListener() {
    return this.provinciasActualizadas.asObservable();
  }

  getEstudiantesXDivisionListener() {
    return this.estudiantesXDivisionActualizados.asObservable();
  }

  // Obtenemos las provincias de la bd y actualizamos a los componentes con el observador
  getProvincias() {
    this.http
      .get<{ provincias: Provincia[] }>(environment.apiUrl + "/provincia")
      .subscribe(response => {
        this.provincias = response.provincias;
        this.provinciasActualizadas.next([...this.provincias]);
      });
  }

  getLocalidadesListener() {
    return this.localidadesActualizadas.asObservable();
  }

  getLocalidades() {
    this.http
      .get<{ localidades: Localidad[] }>(environment.apiUrl + "/localidad")
      .subscribe(response => {
        this.localidades = response.localidades;
        this.localidadesActualizadas.next([...this.localidades]);
      });
  }

  getNacionalidadesListener() {
    return this.nacionalidadesActualizadas.asObservable();
  }

  getNacionalidades() {
    this.http
      .get<{ nacionalidades: Nacionalidad[] }>(
        environment.apiUrl + "/nacionalidad"
      )
      .subscribe(response => {
        this.nacionalidades = response.nacionalidades;
        this.nacionalidadesActualizadas.next([...this.nacionalidades]);
      });
  }

  buscarEstudiantesDocumento(tipo: string, numero: number) {
    let params = new HttpParams()
      .set("tipo", tipo)
      .set("numero", numero.toString());
    this.http
      .get<{ estudiantes: Estudiante[] }>(
        environment.apiUrl + "/estudiante/documento",
        { params: params }
      )
      .subscribe(response => {
        this.estudiantes = response.estudiantes;
        this.estudiantesBuscados.next([...this.estudiantes]);
      });
  }

  buscarEstudiantesNombreApellido(nombre: string, apellido: string) {
    let params = new HttpParams()
      .set("nombre", nombre)
      .set("apellido", apellido);
    this.http
      .get<{ estudiantes: Estudiante[] }>(
        environment.apiUrl + "/estudiante/nombreyapellido",
        { params: params }
      )
      .subscribe(response => {
        this.estudiantes = response.estudiantes;
        this.estudiantesBuscados.next([...this.estudiantes]);
      });
  }

  modificarEstudiante(
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
    // adultoResponsable: string
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
    this.http
      .patch<{ message: string }>(
        environment.apiUrl + "/estudiante/modificar",
        estudianteModificado
      )
      .subscribe(response => {
        console.log(response.message);
      });
  }

  //Parece que este metodo no se usa
  // //Toma los datos que le da el backend y retorna un vector (ordenado por apellido) de objetos que tienen _id, nombre, apellido, presente y fecha
  // buscarEstudiantesPorDivision(division: string) {
  //   let params = new HttpParams().set("division", division);
  //   this.http
  //     .get<{ estudiantesXDivision: any }>(
  //       environment.apiUrl + "/estudiante/division",
  //       { params: params }
  //     )
  //     .subscribe(response => {
  //       this.estudiantesXDivision = response.estudiantesXDivision;
  //       this.estudiantesXDivisionActualizados.next([
  //         ...this.estudiantesXDivision
  //       ]);
  //     });
  // }

  //Recibe un vector con datos de estudiantes (_id, nombre y apellido) y presentismo (fecha y presente) y lo envia al backend para registrarlo
  registrarAsistencia(estudiantesXDivision: any[], asistenciaNueva: string) {
    let params = new HttpParams().set("asistenciaNueva", asistenciaNueva);
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/estudiante/asistencia",
      estudiantesXDivision,
      { params: params }
    );
  }

  getDivisionXAñoListener() {
    return this.divisionXCursoActualizada.asObservable();
  }

  obtenerCursosDeDocente(idDocente:string) {
    let params = new HttpParams().set("idDocente", idDocente);
    return this.http.get<{ cursos: any[] }>(environment.apiUrl + "/curso/docente",{params: params});
  }

  obtenerCursos() {
    return this.http.get<{ cursos: any[] }>(environment.apiUrl + "/curso");
  }

  obtenerMateriasXCurso(idcurso, idDocente) {
    let params = new HttpParams()
      .set("idCurso", idcurso)
      .set("idDocente", idDocente);
    return this.http.get<{ materias: any[] }>(
      environment.apiUrl + "/curso/materias",
      { params: params }
    );
  }

  inscribirEstudiante(
    idEstudiante: string,
    idCurso: string,
    documentosEntregados: any[]
  ) {
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/curso/inscripcion",
      {
        idEstudiante: idEstudiante,
        idCurso: idCurso,
        documentosEntregados: documentosEntregados
      }
    );
  }

  registrarRetiroAnticipado(idEstudiante: string, antes10am: Boolean) {
    return this.http.post<{ message: string; exito: string }>(
      environment.apiUrl + "/estudiante/retiro",
      { idEstudiante: idEstudiante, antes10am: antes10am }
    );
  }

  obtenerDocumentosDeEstudiantesXCurso(curso: string) {
    let params = new HttpParams().set("curso", curso);
    return this.http.get<any[]>(environment.apiUrl + "/curso/documentos", {
      params: params
    });
  }

  registrarDocumentosInscripcion(estudiantes: any[]) {
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/estudiante/documentos",
      estudiantes
    );
  }

  obtenerEstudiantesXCursoXMateria(
    idCurso: string,
    idMateria: string,
    trimestre: string
  ) {
    let params = new HttpParams()
      .set("idCurso", idCurso)
      .set("idMateria", idMateria)
      .set("trimestre", trimestre);
    return this.http.get<{ estudiantes: any[] }>(
      environment.apiUrl + "/curso/estudiantes/materias/calificaciones",
      {
        params: params
      }
    );
  }

  registrarCalificaciones(
    estudiantes: any[],
    idMateria: string,
    trimestre: string
  ) {
    let params = new HttpParams()
      .set("idMateria", idMateria)
      .set("trimestre", trimestre);
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/curso/estudiantes/materias/calificaciones",
      estudiantes,
      { params: params }
    );
  }

  cargarAsistencia(curso: string) {
    let params = new HttpParams().set("curso", curso);
    return this.http.get<{ estudiantes: any[]; asistenciaNueva: string }>(
      environment.apiUrl + "/estudiante/asistencia",
      { params: params }
    );
  }

  obtenerInasistenciasDeEstudiante() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.estudianteSeleccionado._id
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      contadorInasistenciasInjustificada: number;
      contadorInasistenciasJustificada: number;
    }>(environment.apiUrl + "/estudiante/asistenciaEstudiante", {
      params: params
    });
  }

  //Con el id del estudiante y el trimestre seleccionado, obtiene las materias y sus calificaciones
  obtenerCalificacionesXMateriaXEstudiante(trimestre: string) {
    let params = new HttpParams()
      .set("idEstudiante", this.estudianteSeleccionado._id)
      .set("trimestre", trimestre);
    return this.http.get<{
      message: string;
      exito: boolean;
      vectorCalXMat: any[];
    }>(environment.apiUrl + "/estudiante/materia/calificaciones", {
      params: params
    });
  }

  justificarInasistencia(ultimasInasistencias: any[]) {
    return this.http.post<{ message: string; exito: boolean }>(
      environment.apiUrl + "/estudiante/inasistencia/justificada",
      ultimasInasistencias
    );
  }

  getTutoresDeEstudiante() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.estudianteSeleccionado._id
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      tutores: any[];
    }>(environment.apiUrl + "/estudiante/tutores", {
      params: params
    });
  }

  obtenerUltimasInasistencias() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.estudianteSeleccionado._id
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      inasistencias: any[];
    }>(environment.apiUrl + "/estudiante/inasistencias", {
      params: params
    });
  }

}
