import { environment } from "src/environments/environment";
import { AdultoResponsable } from "./adultoResponsable.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { AutenticacionService } from "../login/autenticacionService.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class AdultoResponsableService implements OnDestroy {
  adultoResponsableEstudiante: AdultoResponsable;
  private unsubscribe: Subject<void> = new Subject();

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
    this.authServicio.validarDatos(numeroDocumento, tipoDocumento, email).subscribe(
      (res) => {
        if (res.exito) {
          this.authServicio
            .crearUsuario(
              email,
              numeroDocumento.toString(),
              "AdultoResponsable"
            )
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
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
                  idUsuario,
                };
                let datos = {
                  AR: adultoResponsable,
                  idEstudiante: idEstudiante,
                };
                this.http
                  .post<{ message: string; exito: boolean }>(
                    environment.apiUrl + "/adultoResponsable",
                    { datos: datos }
                  )
                  .pipe(takeUntil(this.unsubscribe))
                  .subscribe((response) => {
                    subject.next(response);
                  });
              } else {
                subject.next(res);
              }
            });
        } else {
          subject.next(res);
        }
      }
    );

    return subject.asObservable();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  getDatosEstudiantes(idUsuario: string) {
    let params = new HttpParams().set("idUsuario", idUsuario);
    return this.http.get<{
      estudiantes: any[];
      exito: boolean;
      message: string;
    }>(environment.apiUrl + "/adultoResponsable/estudiantes", {
      params: params,
    });
  }
}
