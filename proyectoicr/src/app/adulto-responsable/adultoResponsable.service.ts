import { AdultoResponsable } from './adultoResponsable.model';
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: "root"
})
export class AdultoResponsableService {

  constructor(public http: HttpClient){}

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
}
