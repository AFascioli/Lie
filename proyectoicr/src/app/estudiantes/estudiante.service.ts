import { Injectable } from "@angular/core";
import { Estudiante } from "./estudiante.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Provincia } from "./provincias.model";
import { Subject } from "rxjs";
import { Localidad } from "./localidades.model";
import { Nacionalidad } from "./nacionalidades.model";
import { AdultoResponsable } from './adultoResponsable.model';
import { Empleado } from './empleado.model';

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
    telefonoFijo: number,
    adultoResponsable: string
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
      telefonoFijo,
      adultoResponsable
    };
    this.http
      .post<{ message: string }>("http://localhost:3000/estudiante", estudiante)
      .subscribe(response => {
        console.log(response.message);
      });
  }

  borrarEstudiante(_id) {
    let params = new HttpParams().set("_id", _id);
    this.http
      .delete<{ message: string }>("http://localhost:3000/estudiante/borrar", {
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
      .get<{ provincias: Provincia[] }>("http://localhost:3000/provincia")
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
      .get<{ localidades: Localidad[] }>("http://localhost:3000/localidad")
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
        "http://localhost:3000/nacionalidad"
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
        "http://localhost:3000/estudiante/documento/",
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
        "http://localhost:3000/estudiante/nombreyapellido",
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
    telefonoFijo: number,
    adultoResponsable: string
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
      telefonoFijo,
      adultoResponsable
    };
    this.http
      .patch<{ message: string }>(
        "http://localhost:3000/estudiante/modificar",
        estudianteModificado
      )
      .subscribe(response => {
        console.log(response.message);
      });
  }

  //Toma los datos que le da el beckend y retorna un vector (ordenado por apellido) de objetos que tienen _id, nombre, apellido, presente y fecha
  buscarEstudiantesPorDivision(division: string) {
    let params = new HttpParams().set("division", division);
    this.http
      .get<{ estudiantesXDivision: any }>(
        "http://localhost:3000/estudiante/division",
        { params: params }
      )
      .subscribe(response => {
        this.estudiantesXDivision = response.estudiantesXDivision;
        this.estudiantesXDivisionActualizados.next([
          ...this.estudiantesXDivision
        ]);
      });
  }

  //Recibe un vector con datos de estudiantes (_id, nombre y apellido) y presentismo (fecha y presente) y lo envia al backend para registrarlo
  registrarAsistencia(estudiantesXDivision: any[], asistenciaNueva: string) {
    let params = new HttpParams().set("asistenciaNueva", asistenciaNueva);
    this.http
      .post<{ message: string }>(
        "http://localhost:3000/estudiante/asistencia",
        estudiantesXDivision,
        { params: params }
      )
      .subscribe(response => {});
  }

  getDivisionXAñoListener() {
    return this.divisionXCursoActualizada.asObservable();
  }

  obtenerCursos() {
    return this.http.get<{ cursos: any[] }>("http://localhost:3000/curso");
  }

  obtenerMateriasXCurso(idcurso) {
    let params = new HttpParams().set("idcurso", idcurso);
    return this.http.get<{ materias: any[] }>(
      "http://localhost:3000/curso/materias",
      { params: params }
    );
  }

  inscribirEstudiante(
    IdEstudiante: string,
    division: string,
    documentosEntregados: any[]
  ) {
    return this.http.post<{ message: string; exito: boolean }>(
      "http://localhost:3000/curso/inscripcion",
      {
        IdEstudiante: IdEstudiante,
        division: division,
        documentosEntregados: documentosEntregados
      }
    );
  }

  registrarRetiroAnticipado(IdEstudiante: string, antes10am: Boolean) {
    return this.http.post<{ message: string; exito: string }>(
      "http://localhost:3000/estudiante/retiro",
      { IdEstudiante: IdEstudiante, antes10am: antes10am }
    );
  }

  obtenerEstudiantesXCurso(curso: string) {
    let params = new HttpParams().set("curso", curso);
    return this.http.get<any[]>("http://localhost:3000/curso/documentos", {
      params: params
    });
  }

  registrarDocumentosInscripcion(estudiantes: any[]) {
    return this.http.post<{ message: string; exito: boolean }>(
      "http://localhost:3000/estudiante/documentos",
      estudiantes
    );
  }

  obtenerEstudiantesXCursoXMateria(
    idcurso: string,
    idmateria: string,
    trimestre: string
  ) {
    let params = new HttpParams()
      .set("idcurso", idcurso)
      .set("idmateria", idmateria)
      .set("trimestre", trimestre);
    return this.http.get<{ estudiantes: any[] }>(
      "http://localhost:3000/curso/estudiantes/materias/calificaciones",
      {
        params: params
      }
    );
  }

  registrarAdultoResponsable(
    apellido: string,
    nombre: string,
    tipoDocumento: string,
    numeroDocumento: number,
    sexo: string,
    nacionalidad: string,
    fechaNacimiento: string,
    telefono: number,
    email: string,
    tutor: boolean,
    idUsuario: string
  ) {
    const adultoResponsable: AdultoResponsable = {
      apellido,
      nombre,
      tipoDocumento,
      numeroDocumento,
      sexo,
      nacionalidad,
      fechaNacimiento,
      telefono,
      email,
      tutor,
      idUsuario//idUsuario #resolve
    };
    this.http
      .post<{ message: string, exito: boolean }>("http://localhost:3000/adultoResponsable", adultoResponsable)
      .subscribe(response => {
        console.log(response);
      });
  }

  registrarEmpleado(
    apellido: string,
    nombre: string,
    tipoDocumento: string,
    numeroDocumento: number,
    sexo: string,
    nacionalidad: string,
    fechaNacimiento: string,
    telefono: number,
    email: string,
    tipoEmpleado: string,
    idUsuario: string
  ) {
    const empleado: Empleado = {
      apellido,
      nombre,
      tipoDocumento,
      numeroDocumento,
      sexo,
      nacionalidad,
      fechaNacimiento,
      telefono,
      email,
      tipoEmpleado,
      idUsuario//idUsuario #resolve
    };
    this.http
      .post<{ message: string, exito: boolean }>("http://localhost:3000/empleado", empleado)
      .subscribe(response => {
        console.log(response);
      });
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
      "http://localhost:3000/curso/estudiantes/materias/calificaciones",
      estudiantes,
      { params: params }
    );
  }

  cargarAsistenciaBackend(curso: string) {
    let params = new HttpParams().set("curso", curso);
    return this.http.get<{ estudiantes: any[]; asistenciaNueva: string }>(
      "http://localhost:3000/estudiante/asistencia",
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
      contadorInasistencia: number;
    }>("http://localhost:3000/estudiante/asistenciaEstudiante", {
      params: params
    });
  }
}
