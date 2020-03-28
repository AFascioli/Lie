import { Injectable } from "@angular/core";
import { Estudiante } from "../estudiantes/estudiante.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Provincia } from "./provincias.model";
import { Subject } from "rxjs";
import { Localidad } from "./localidades.model";
import { Nacionalidad } from "../ubicacion/nacionalidades.model";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class UbicacionService {
  estudianteSeleccionado: Estudiante;
  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  estudiantes: Estudiante[] = [];
  nacionalidades: Nacionalidad[] = [];
  private provinciasActualizadas = new Subject<Provincia[]>();
  private localidadesActualizadas = new Subject<Localidad[]>();
  private nacionalidadesActualizadas = new Subject<Nacionalidad[]>();

  constructor(public http: HttpClient) {}

  public getLocalidadesListener() {
    return this.localidadesActualizadas.asObservable();
  }

  //Obtiene todas las localidades almacenadas en la base de datos
  public getLocalidades() {
    this.http
      .get<{ localidades: Localidad[] }>(
        environment.apiUrl + "/ubicacion/localidad"
      )
      .subscribe(response => {
        this.localidades = response.localidades;
        this.localidadesActualizadas.next([...this.localidades]);
      });
  }

  public getNacionalidadesListener() {
    return this.nacionalidadesActualizadas.asObservable();
  }

  //Obtiene todas las nacionalidades almacenadas en la base de datos
  public getNacionalidades() {
    this.http
      .get<{ nacionalidades: Nacionalidad[] }>(
        environment.apiUrl + "/ubicacion/nacionalidad"
      )
      .subscribe(response => {
        console.log(response);
        this.nacionalidades = response.nacionalidades;
        this.nacionalidadesActualizadas.next([...this.nacionalidades]);
      });
  }

  //Obtiene todas las provincias almacenadas en la base de datos
  public getProvincias() {
    this.http
      .get<{ provincias: Provincia[] }>(
        environment.apiUrl + "/ubicacion/provincia"
      )
      .subscribe(response => {
        this.provincias = response.provincias;
        this.provinciasActualizadas.next([...this.provincias]);
      });
  }

  public getProvinciasListener() {
    return this.provinciasActualizadas.asObservable();
  }
}
