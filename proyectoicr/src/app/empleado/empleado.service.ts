import { AutencacionService } from "./../login/autenticacionService.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Empleado } from "./empleado.model";

@Injectable({
  providedIn: "root"
})
export class EmpleadoService {
  constructor(
    public http: HttpClient,
    public authServicio: AutencacionService
  ) {}

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
    tipoEmpleado: string
  ) {
    this.authServicio
      .crearUsuario(email, numeroDocumento.toString())
      .subscribe(res => {
        if (res.exito) {
          let idUsuario = res.id;
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
            idUsuario
          };
          this.http
            .post<{ message: string; exito: boolean}>(
              "http://localhost:3000/empleado",
              empleado
            )
            .subscribe(response => {
              console.log(response);
            });
        } else {
          console.log(res.message);
        }
      });
  }
}
