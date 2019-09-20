import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { Empleado } from './empleado.model';

@Injectable({
  providedIn: "root"
})
export class EmpleadoService {

  constructor(public http: HttpClient){}

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
}
