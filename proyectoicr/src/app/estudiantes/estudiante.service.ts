import { Injectable } from '@angular/core';
import { Estudiante } from './estudiante.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Provincia } from './provincias.model';
import { Subject } from 'rxjs';
import { Localidad } from './localidades.model';

@Injectable ({
  providedIn: 'root'
})
export class EstudiantesService {
  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  estudiantes: Estudiante[] = [];
  private provinciasActualizadas = new Subject<Provincia[]>();
  private localidadesActualizadas= new Subject<Localidad[]>();
  private estudiantesBuscados = new Subject<Estudiante[]>();

  constructor(public http: HttpClient) {}

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
  provinciaNacimiento: string,
  localidadNacimiento: string,
  fechaNacimiento: Date,
  estadoCivil: string,
  telefonoFijo: number,
  adultoResponsable: string
  ) {
    const estudiante: Estudiante = {
    id: null,
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
    provinciaNacimiento,
    localidadNacimiento,
    fechaNacimiento,
    estadoCivil,
    telefonoFijo,
    adultoResponsable };
    this.http.post<{message: string}>('http://localhost:3000/estudiante', estudiante)
      .subscribe((response) => {
        console.log(response);
      });
  }


  getEstudiantesListener(){
    return this.estudiantesBuscados.asObservable();
  }

  // Metodo para obtener un listener, cosa que de los componentes puedan obtener info actualizada
  getProvinciasListener() {
    return this.provinciasActualizadas.asObservable();
  }

  // Obtenemos las provincias de la bd y actualizamos a los componentes con el observador
  getProvincias() {
    this.http.get<{provincias: Provincia[]}>('http://localhost:3000/provincia')
    .subscribe((response) => {
      this.provincias = response.provincias;
      this.provinciasActualizadas.next([...this.provincias]);
    });
  }

  getLocalidadesListener(){
    return this.localidadesActualizadas.asObservable();
    }

  getLocalidades() {
    this.http.get<{localidades: Localidad[]}>('http://localhost:3000/localidad')
      .subscribe((response) => {
        this.localidades = response.localidades;
        this.localidadesActualizadas.next([...this.localidades]);
      });
   }

  buscarEstudiantesDocumento(tipo: string, numero: number){
    let params = new HttpParams().set("tipo", tipo).set("numero", numero.toString());
    console.log("estudiante.service.ts-->buscarEstudiantesDocumento");
    this.http.get<{estudiantes: Estudiante[]}>('http://localhost:3000/estudiante/documento/', {params: params})
    .subscribe((response)=>{
        this.estudiantes = response.estudiantes;
        this.estudiantesBuscados.next([...this.estudiantes]);
      })
  }

  buscarEstudiantesNombreApellido(nombre: string, apellido: string){
    let params = new HttpParams().set("nombre", nombre).set("apellido", apellido);
    this.http.get<{estudiantes: Estudiante[]}>('http://localhost:3000/estudiante/nombreyapellido', {params: params})
      .subscribe((response)=>{
        this.estudiantes = response.estudiantes;
        this.estudiantesBuscados.next([...this.estudiantes]);
      })
  }

}
