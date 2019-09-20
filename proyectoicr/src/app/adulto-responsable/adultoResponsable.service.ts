import { AdultoResponsable } from "./adultoResponsable.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AutencacionService } from "../login/autenticacionService.service";

@Injectable({
  providedIn: "root"
})
export class AdultoResponsableService {
  constructor(
    public http: HttpClient,
    public authServicio: AutencacionService
  ) {}

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
    tutor: boolean
  ) {
    this.authServicio
      .crearUsuario(email, numeroDocumento.toString())
      .subscribe(res => {
        if (res.exito) {
          let idUsuario = res.id;
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
            idUsuario
          };
          this.http
            .post<{ message: string; exito: boolean }>(
              "http://localhost:3000/adultoResponsable",
              adultoResponsable
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
