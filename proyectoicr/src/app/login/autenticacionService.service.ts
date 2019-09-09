import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

@Injectable({ providedIn: "root" })
export class AutencacionService {
  private estaAutenticado = false;
  private token: string;
  private tokenTimer: any;
  private authStatusListener = new Subject<boolean>();

  constructor(private http: HttpClient, private router: Router) {}

  getToken() {
    return this.token;
  }

  getIsAuth() {
    return this.estaAutenticado;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  crearUsuario(email: string, password: string) {
    const authData = { email: email, password: password };
    return this.http.post<{ message: string; exito: string }>(
      "http://localhost:3000/usuario/signup",
      authData
    );
  }

  //Manda al backend email y contraseña y si devuelve un token, autentica al usuario y guarda
  //en el local storage el token y el vencimiento del token (para auto loguearlo).
  //Se retorna un obsevable para que el componente pueda leer el mensaje del backend.
  login(email: string, password: string) {
    const authData = { email: email, password: password };
    let respuesta: string = "Autenciación fallida";
    var subject = new Subject<string>();
    this.http
      .post<{
        token: string;
        duracionToken: number;
        exito: boolean;
        message: string;
      }>("http://localhost:3000/usuario/login", authData)
      .subscribe(response => {
        if (response.token) {
          this.token = response.token;
          respuesta = response.message;
          const duracionToken = response.duracionToken;
          this.timerAutenticacion(duracionToken);
          this.estaAutenticado = true;
          this.authStatusListener.next(true);
          const fechaActual = new Date();
          const vencimientoToken = new Date(
            fechaActual.getTime() + duracionToken * 1000
          );
          this.guardarDatosAutenticacion(response.token, vencimientoToken);
          this.router.navigate(["/"]);
        }
        subject.next(respuesta);
      });
    return subject.asObservable();
  }

  //Obtine la info guardada en el local storage y si no se vencio en token lo autentica al usuario
  autenticacionAutomatica() {
    const infoAutenticacion = this.obtenerDatosAutenticacion();
    if (!infoAutenticacion) {
      return;
    }
    const fechaActual = new Date();
    const expiraEn =
      infoAutenticacion.vencimientoToken.getTime() - fechaActual.getTime();
    if (expiraEn > 0) {
      this.token = infoAutenticacion.token;
      this.estaAutenticado = true;
      this.timerAutenticacion(expiraEn / 1000);
      this.authStatusListener.next(true);
    }
  }

  //Limpia el token y limpia el local storage
  logout() {
    this.token = null;
    this.estaAutenticado = false;
    this.authStatusListener.next(false);
    clearTimeout(this.tokenTimer);
    this.limpiarDatosAutenticacion();
    this.router.navigate(["/"]);
    console.log("autenticacion automatica");
  }

  //Recibe la duracion en segundo y pone un timer que cuando se cumpla el tiempo desloguea al usuario
  private timerAutenticacion(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  private guardarDatosAutenticacion(token: string, fechaVencimiento: Date) {
    localStorage.setItem("token", token);
    localStorage.setItem("vencimiento", fechaVencimiento.toISOString());
  }

  private limpiarDatosAutenticacion() {
    localStorage.removeItem("token");
    localStorage.removeItem("vencimiento");
  }

  private obtenerDatosAutenticacion() {
    const token = localStorage.getItem("token");
    const fechaVencimiento = localStorage.getItem("vencimiento");
    if (!token || !fechaVencimiento) {
      return;
    }
    return {
      token: token,
      vencimientoToken: new Date(fechaVencimiento)
    };
  }
}
