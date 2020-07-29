import { environment } from "src/environments/environment";
import { AdultoResponsable } from "./adultoResponsable.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { AutenticacionService } from "../login/autenticacionService.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { EstudiantesService } from "../estudiantes/estudiante.service";

@Injectable({
  providedIn: "root",
})
export class AdultoResponsableService implements OnDestroy {
  adultoResponsableEstudiante: AdultoResponsable;
  adultosResponsablesFiltrados: AdultoResponsable[];
  private unsubscribe: Subject<void> = new Subject();
  adultoResponsableSeleccionado: AdultoResponsable;
  retornoDesdeAcciones: boolean;
  busquedaARXNombre: boolean;

  constructor(
    public http: HttpClient,
    public authServicio: AutenticacionService,
    public servicioEstudiante: EstudiantesService
  ) {}

  public registrarAdultoResponsable(
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
      .validarDatos(numeroDocumento, tipoDocumento, email)
      .subscribe((res) => {
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
      });

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

  //Obtiene todos los docentes de un estudiante pasado por parámetro
  //@params: id del estudiante
  public getDocentesDeEstudiante() {
    let params = new HttpParams().set(
      "idEstudiante",
      this.servicioEstudiante.estudianteSeleccionado._id
    );
    return this.http.get<{
      message: string;
      exito: boolean;
      docentes: any[];
    }>(environment.apiUrl + "/empleado/estudiante", {
      params: params,
    });
  }

  public notificarReunionDocente(idDocente, cuerpo, idAdulto) {
    return this.http.post<{
      message: string;
      exito: boolean;
    }>(environment.apiUrl + "/usuario/reunion/docente", {
      idDocente: idDocente,
      cuerpo: cuerpo,
      idAdulto: idAdulto,
    });
  }

  //Me retorna todos los adultos responsables cuyo tipo y numero de documento coinciden con los pasados por parámetro
  //@params: tipo de documento del adulto responsable
  //@params: número de documento del adulto responsable
  public buscarAdultoResponsableXDocumento(tipo: string, numero: number) {
    let params = new HttpParams()
      .set("tipo", tipo)
      .set("numero", numero.toString());
    return this.http.get<{ adultosResponsables: AdultoResponsable[] }>(
      environment.apiUrl + "/adultoResponsable/documento",
      { params: params }
    );
  }

  //Me retorna todos los  adultos responsables cuyo nombre y apellido coinciden con los pasados por parámetro
  //@params: nombre del adulto responsable
  //@params: apellido del adulto responsable
  public buscarAdultoResponsableXNombre(nombre: string, apellido: string) {
    let params = new HttpParams()
      .set("nombre", nombre)
      .set("apellido", apellido);
    return this.http.get<{ adultosResponsables: AdultoResponsable[] }>(
      environment.apiUrl + "/adultoResponsable/nombre",
      { params: params }
    );
  }

  //Asocia el adulto responsable al estudiante
  //@params: id del estudiante
  public asociarAdultoResponsable(
    idEstudiante: string,
    adultosResponsables: Array<any>
  ) {
    return this.http.post<{ message: string; exito: string }>(
      environment.apiUrl + "/adultoResponsable/estudiante",
      {
        idEstudiante: idEstudiante,
        adultosResponsables: adultosResponsables,
      }
    );
    
  public getPreferenciasAR(idUsuarioAR) {
    let params = new HttpParams().set("idUsuarioAR", idUsuarioAR);
    return this.http.get<{
      message: string;
      exito: boolean;
      preferenciasPush: any[];
    }>(environment.apiUrl + "/adultoResponsable/preferencias", {
      params: params,
    });
  }

  public actualizarPreferenciasAR(idUsuarioAR, preferencias: any[]) {
    return this.http.post<{
      message: string;
      exito: boolean;
    }>(environment.apiUrl + "/adultoResponsable/preferencias", {
      idUsuarioAR: idUsuarioAR,
      preferencias: preferencias
    });
  }
}
