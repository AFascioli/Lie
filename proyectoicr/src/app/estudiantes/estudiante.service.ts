import { Injectable } from '@angular/core';
import { Estudiante } from './estudiante.model';
import { HttpClient } from '@angular/common/http';
import { Provincia } from './provincias.model';
import { Subject } from 'rxjs';

@Injectable ({
  providedIn: 'root'
})
export class EstudiantesService {
  provincias: Provincia[] = [];
  private provinciasActualizadas = new Subject<Provincia[]>();

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
}
