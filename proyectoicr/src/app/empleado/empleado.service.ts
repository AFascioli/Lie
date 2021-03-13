import { AutenticacionService } from "./../login/autenticacionService.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Empleado } from "./empleado.model";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class EmpleadoService implements OnDestroy {
  constructor(
    public http: HttpClient,
    public authServicio: AutenticacionService
  ) {}
  private unsubscribe: Subject<void> = new Subject();

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

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
    let subject = new Subject<any>();
    this.authServicio
      .validarDatos(numeroDocumento, tipoDocumento, email)
      .subscribe((res) => {
        if (res.exito) {
          this.authServicio
            .crearUsuario(email, numeroDocumento.toString(), tipoEmpleado)
            .pipe(takeUntil(this.unsubscribe))
            .subscribe((res) => {
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
                  idUsuario,
                };
                this.http
                  .post<{ message: string; exito: boolean }>(
                    "http://localhost:3000/empleado",
                    empleado
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

  public buscarEmpleadoXDocumento(tipo: string, numero: number) {
    let params = new HttpParams()
      .set("tipo", tipo)
      .set("numero", numero.toString());
    return this.http.get<{ empleados: any[] }>(
      environment.apiUrl + "/empleado/documento",
      { params: params }
    );
  }

  public buscarEmpleadoXNombre(nombre: string, apellido: string) {
    let params = new HttpParams()
      .set("nombre", nombre)
      .set("apellido", apellido);
    return this.http.get<{ empleados: any[] }>(
      environment.apiUrl + "/empleado/nombre",
      { params: params }
    );
  }

  public modificarEmpleado(empleado) {
    return this.http.post<{
      message: string;
      exito: boolean;
    }>(environment.apiUrl + "/empleado/modificar", {
      empleado: empleado,
    });
  }
}
