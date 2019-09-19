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
  private usuarioAutenticado: string;

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

  getUsuarioAutenticado() {
    return this.usuarioAutenticado;
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
    let respuesta: string;
    var subject = new Subject<string>();
    this.http
      .post<{
        token: string;
        duracionToken: number;
        exito: boolean;
        message: string;
      }>("http://localhost:3000/usuario/login", authData)
      .subscribe(response => {
        respuesta = response.message;
        if (response.token) {
          this.usuarioAutenticado = email;
          this.token = response.token;
          const duracionToken = response.duracionToken;
          this.timerAutenticacion(duracionToken);
          this.estaAutenticado = true;
          this.authStatusListener.next(true);
          const fechaActual = new Date();
          const vencimientoToken = new Date(
            fechaActual.getTime() + duracionToken * 1000
          );
          this.guardarDatosAutenticacion(
            response.token,
            vencimientoToken,
            this.usuarioAutenticado
          );
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
      this.usuarioAutenticado = infoAutenticacion.usuario;
      this.estaAutenticado = true;
      this.timerAutenticacion(expiraEn / 1000);
      this.authStatusListener.next(true);
    }
  }

  //Limpia el token y limpia el local storage
  logout() {
    this.token = null;
    this.estaAutenticado = false;
    this.usuarioAutenticado = "";
    this.authStatusListener.next(false);
    clearTimeout(this.tokenTimer);
    this.limpiarDatosAutenticacion();
    this.router.navigate(["/login"]);
  }

  //Recibe la duracion en segundo y pone un timer que cuando se cumpla el tiempo desloguea al usuario
  private timerAutenticacion(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  private guardarDatosAutenticacion(
    token: string,
    fechaVencimiento: Date,
    usuario: string
  ) {
    localStorage.setItem("token", token);
    localStorage.setItem("vencimiento", fechaVencimiento.toISOString());
    localStorage.setItem("usuario", usuario);
  }

  private limpiarDatosAutenticacion() {
    localStorage.removeItem("token");
    localStorage.removeItem("vencimiento");
    localStorage.removeItem("usuario");
  }

  private obtenerDatosAutenticacion() {
    const token = localStorage.getItem("token");
    const fechaVencimiento = localStorage.getItem("vencimiento");
    const usuario = localStorage.getItem("usuario");
    if (!token || !fechaVencimiento) {
      return;
    }
    return {
      token: token,
      vencimientoToken: new Date(fechaVencimiento),
      usuario: usuario
    };
  }

  cambiarPassword(passwordVieja, passwordNueva) {
    const datosContraseña = {
      passwordVieja: passwordVieja,
      passwordNueva: passwordNueva,
      usuario: this.usuarioAutenticado
    };
    return this.http.post<{
      exito: boolean;
      message: string;
    }>("http://localhost:3000/usuario/cambiarPassword", datosContraseña);
  }

  //Metodo sign up que crea un usuario segun un rol dado
  signUp(mail: string, password: string, rol: string) {
    return this.http.post("http://localhost:3000/usuario/signup", {
      mail: mail,
      password: password,
      rol: rol
    });
  }
}
