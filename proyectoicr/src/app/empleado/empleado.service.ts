import { AutenticacionService } from "./../login/autenticacionService.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Empleado } from "./empleado.model";
import { Subject } from 'rxjs';

@Injectable({
  providedIn: "root"
})
export class EmpleadoService {
  constructor(
    public http: HttpClient,
    public authServicio: AutenticacionService
  ) {}

  registrarEmpleado(
    apellido: string,
    nombre: string,
    tipoDocumento: string,
    numeroDocumento: number,
    sexo: string,
    nacionalidad: string,
    fechaNacimiento: Date,
    telefono: number,
    email: string,
    tipoEmpleado: string
  ) {
    let subject= new Subject<any>();
    this.authServicio
      .crearUsuario(email, numeroDocumento.toString(), tipoEmpleado)
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
          console.log(empleado);
          this.http
            .post<{ message: string; exito: boolean}>(
              "http://localhost:3000/empleado",
              empleado
            )
            .subscribe(response => {
              subject.next(response);
            });
        } else {
          subject.next(res);
        }
      });
    return subject.asObservable();
  }
}
