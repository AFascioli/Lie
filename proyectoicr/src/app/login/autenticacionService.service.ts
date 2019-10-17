import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: "root" })
export class AutenticacionService {
  private estaAutenticado = false;
  private token: string;
  private tokenTimer: any;
  private authStatusListener = new Subject<boolean>();
  private usuarioAutenticado: string;
  private rol: string;
  private id: string;

  constructor(private http: HttpClient, private router: Router) {}

  getToken() {
    return this.token;
  }

  getId() {
    return this.id;
  }

  getRol() {
    return this.rol;
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

  crearUsuario(email: string, password: string, rol: string) {
    const authData = { email: email, password: password, rol: rol };
    return this.http.post<{ message: string; exito: string; id: string }>(
      environment.apiUrl + "/usuario/signup",
      authData
    );
  }

  //Manda al backend email y contraseña y si devuelve un token, autentica al usuario y guarda
  //en el local storage el token y el vencimiento del token (para auto loguearlo).
  //Se retorna un obsevable para que el componente pueda leer el mensaje del backend.
  login(email: string, password: string) {
    const authData = { email: email, password: password };
    let respuesta: any;
    var subject = new Subject<any>();
    this.http
      .post<{
        token: string;
        duracionToken: number;
        exito: boolean;
        idPersona: string;
        message: string;
        rol: string;
      }>(environment.apiUrl + "/usuario/login", authData)
      .subscribe(response => {
        respuesta = response;
        if (response.token) {
          this.usuarioAutenticado = email;
          this.token = response.token;
          const duracionToken = response.duracionToken;
          this.rol = response.rol;
          this.id= response.idPersona;
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
            this.usuarioAutenticado,
            this.rol,
            this.id
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
      this.rol = infoAutenticacion.rol;
      this.id = infoAutenticacion.id;
      this.estaAutenticado = true;
      this.timerAutenticacion(expiraEn / 1000);
      this.authStatusListener.next(true);
    }
  }

  //Limpia el token y limpia el local storage
  logout() {
    this.token = null;
    this.estaAutenticado = false;
    this.rol= "";
    this.id="";
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
    usuario: string,
    rol: string,
    id: string
  ) {
    localStorage.setItem("token", token);
    localStorage.setItem("vencimiento", fechaVencimiento.toISOString());
    localStorage.setItem("usuario", usuario);
    localStorage.setItem("rol", rol);
    localStorage.setItem("id", id);
  }

  private limpiarDatosAutenticacion() {
    localStorage.removeItem("token");
    localStorage.removeItem("vencimiento");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    localStorage.removeItem("id");
  }

  private obtenerDatosAutenticacion() {
    const token = localStorage.getItem("token");
    const fechaVencimiento = localStorage.getItem("vencimiento");
    const usuario = localStorage.getItem("usuario");
    const rol = localStorage.getItem("rol");
    const id = localStorage.getItem("id");
    if (!token || !fechaVencimiento) {
      return;
    }
    return {
      token: token,
      vencimientoToken: new Date(fechaVencimiento),
      usuario: usuario,
      rol: rol,
      id: id
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

  obtenerPermisosDeRol() {
    let params = new HttpParams().set("rol", this.getRol());
    return this.http.get<{
      message: string;
      exito: boolean;
      permisos: any;
    }>(environment.apiUrl + "/usuario/permisosDeRol", {
      params: params
  });
  }

  addPushSubscriber(sus: any) {
    return this.http.post<{message: string}>(environment.apiUrl + "/usuario/suscripcion", { sub: sus, email: this.usuarioAutenticado});
  }

  //#resolve #borrar
  testNP(){
    return this.http.get<{message: string}>(environment.apiUrl + "/estudiante/notificacion");
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
