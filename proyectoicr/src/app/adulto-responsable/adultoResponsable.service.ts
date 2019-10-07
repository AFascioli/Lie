import { AdultoResponsable } from "./adultoResponsable.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AutenticacionService } from "../login/autenticacionService.service";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class AdultoResponsableService {
  adultoResponsableEstudiante: AdultoResponsable;

  constructor(
    public http: HttpClient,
    public authServicio: AutenticacionService
  ) {}

  registrarAdultoResponsable(
    apellido: string,
    nombre: string,
    tipoDocumento: string,
    numeroDocumento: number,
    sexo: string,
    nacionalidad: string,
    fechaNacimiento: Date,
    telefono: number,
    email: string,
    tutor: boolean,
    idEstudiante: string
  ) {
    var subject = new Subject<any>();
    this.authServicio
      .crearUsuario(email, numeroDocumento.toString(), "AdultoResponsable")
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
          console.log(adultoResponsable);
          let datos= {
            AR: adultoResponsable,
            idEstudiante: idEstudiante
          }
          this.http
            .post<{ message: string; exito: boolean }>(
              "http://localhost:3000/adultoResponsable",
              {  datos: datos }
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
