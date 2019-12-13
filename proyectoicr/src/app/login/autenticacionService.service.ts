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
  private fechasCicloLectivo: any;

  constructor(private http: HttpClient, private router: Router) {}

  public addPushSubscriber(sus: any) {
    return this.http.post<{ message: string }>(
      environment.apiUrl + "/usuario/suscripcion",
      { sub: sus, email: this.usuarioAutenticado }
    );
  }

  public asignarFechasAutomaticamente() {
    const infoFechasCicloLectivo = this.obtenerFechasCicloLectivo();
    if (!infoFechasCicloLectivo) {
      return;
    } else {
      this.fechasCicloLectivo = infoFechasCicloLectivo;
    }
  }

  //Obtine la info guardada en el local storage y si no se vencio en token lo autentica al usuario
  public autenticacionAutomatica() {
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

  public cambiarPassword(passwordVieja, passwordNueva) {
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

  public crearUsuario(email: string, password: string, rol: string) {
    const authData = { email: email, password: password, rol: rol };
    return this.http.post<{ message: string; exito: string; id: string }>(
      environment.apiUrl + "/usuario/signup",
      authData
    );
  }

  public getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  //Me devuelve un objeto de ciclo lectivo con todas las fechas importantes para limitar los procesos
  public getCicloLectivo() {
    return this.http.get<{
      cicloLectivo: any;
      message: string;
      exito: boolean;
    }>(environment.apiUrl + "/cicloLectivo");
  }

  public getFechasCicloLectivo() {
    return this.fechasCicloLectivo;
  }

  public getId() {
    return this.id;
  }

  public getIsAuth() {
    return this.estaAutenticado;
  }

  public getRol() {
    return this.rol;
  }

  public getToken() {
    return this.token;
  }

  public getUsuarioAutenticado() {
    return this.usuarioAutenticado;
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

  public guardarFechasCicloLectivo(cicloLectivo) {
    localStorage.setItem(
      "fechaInicioInscripcion",
      cicloLectivo.fechaInicioInscripcion
    );
    localStorage.setItem(
      "fechaFinInscripcion",
      cicloLectivo.fechaFinInscripcion
    );
    localStorage.setItem(
      "fechaInicioPrimerTrimestre",
      cicloLectivo.fechaInicioPrimerTrimestre
    );
    localStorage.setItem(
      "fechaFinPrimerTrimestre",
      cicloLectivo.fechaFinPrimerTrimestre
    );
    localStorage.setItem(
      "fechaInicioSegundoTrimestre",
      cicloLectivo.fechaInicioSegundoTrimestre
    );
    localStorage.setItem(
      "fechaFinSegundoTrimestre",
      cicloLectivo.fechaFinSegundoTrimestre
    );
    localStorage.setItem(
      "fechaInicioTercerTrimestre",
      cicloLectivo.fechaInicioTercerTrimestre
    );
    localStorage.setItem(
      "fechaFinTercerTrimestre",
      cicloLectivo.fechaFinTercerTrimestre
    );
    localStorage.setItem(
      "fechaInicioExamenes",
      cicloLectivo.fechaInicioExamenes
    );
    localStorage.setItem("fechaFinExamenes", cicloLectivo.fechaFinExamenes);
  }

  private limpiarDatosAutenticacion() {
    localStorage.removeItem("token");
    localStorage.removeItem("vencimiento");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    localStorage.removeItem("id");
  }

  private limpiarFechasCicloLectivo() {
    localStorage.removeItem("fechaInicioInscripcion");
    localStorage.removeItem("fechaFinInscripcion");
    localStorage.removeItem("fechaInicioPrimerTrimestre");
    localStorage.removeItem("fechaFinPrimerTrimestre");
    localStorage.removeItem("fechaInicioSegundoTrimestre");
    localStorage.removeItem("fechaFinSegundoTrimestre");
    localStorage.removeItem("fechaInicioTercerTrimestre");
    localStorage.removeItem("fechaFinTercerTrimestre");
    localStorage.removeItem("fechaInicioExamenes");
    localStorage.removeItem("fechaFinExamenes");
  }

  //Manda al backend email y contraseña y si devuelve un token, autentica al usuario y guarda
  //en el local storage el token y el vencimiento del token (para auto loguearlo).
  //Se retorna un obsevable para que el componente pueda leer el mensaje del backend.
  public login(email: string, password: string) {
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
          this.id = response.idPersona;
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
          if (response.rol != "Adulto Responsable") {
            this.getCicloLectivo().subscribe(response => {
              this.limpiarFechasCicloLectivo();
              this.guardarFechasCicloLectivo(response.cicloLectivo);
              this.fechasCicloLectivo = response.cicloLectivo;
            });
          }
          this.router.navigate(["/"]);
        }
        subject.next(respuesta);
      });

    return subject.asObservable();
  }

  //Limpia el token y limpia el local storage
  public logout() {
    this.token = null;
    this.estaAutenticado = false;
    this.rol = "";
    this.id = "";
    this.usuarioAutenticado = "";
    this.authStatusListener.next(false);
    clearTimeout(this.tokenTimer);
    this.limpiarDatosAutenticacion();
    this.limpiarFechasCicloLectivo();
    this.router.navigate(["/login"]);
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

  public obtenerPermisosDeRol() {
    let params = new HttpParams().set("rol", this.getRol());
    return this.http.get<{
      message: string;
      exito: boolean;
      permisos: any;
    }>(environment.apiUrl + "/usuario/permisosDeRol", {
      params: params
    });
  }

  private obtenerFechasCicloLectivo() {
    const fechaInicioInscripcion = localStorage.getItem(
      "fechaInicioInscripcion"
    );
    const fechaFinInscripcion = localStorage.getItem("fechaFinInscripcion");
    const fechaInicioPrimerTrimestre = localStorage.getItem(
      "fechaInicioPrimerTrimestre"
    );
    const fechaFinPrimerTrimestre = localStorage.getItem(
      "fechaFinPrimerTrimestre"
    );
    const fechaInicioSegundoTrimestre = localStorage.getItem(
      "fechaInicioSegundoTrimestre"
    );
    const fechaFinSegundoTrimestre = localStorage.getItem(
      "fechaFinSegundoTrimestre"
    );
    const fechaInicioTercerTrimestre = localStorage.getItem(
      "fechaInicioTercerTrimestre"
    );
    const fechaFinTercerTrimestre = localStorage.getItem(
      "fechaFinTercerTrimestre"
    );
    const fechaInicioExamenes = localStorage.getItem("fechaInicioExamenes");
    const fechaFinExamenes = localStorage.getItem("fechaFinExamenes");

    return {
      fechaInicioInscripcion: fechaInicioInscripcion,
      fechaFinInscripcion: fechaFinInscripcion,
      fechaInicioPrimerTrimestre: fechaInicioPrimerTrimestre,
      fechaFinPrimerTrimestre: fechaFinPrimerTrimestre,
      fechaInicioSegundoTrimestre: fechaInicioSegundoTrimestre,
      fechaFinSegundoTrimestre: fechaFinSegundoTrimestre,
      fechaInicioTercerTrimestre: fechaInicioTercerTrimestre,
      fechaFinTercerTrimestre: fechaFinTercerTrimestre,
      fechaInicioExamenes: fechaInicioExamenes,
      fechaFinExamenes: fechaFinExamenes
    };
  }

  public pruebaNotificacion() {
    let params = new HttpParams().set("email", this.usuarioAutenticado);
    return this.http.get<{ message: string }>(
      environment.apiUrl + "/usuario/notificacion",
      { params: params }
    );
  }

  //Metodo sign up que crea un usuario segun un rol dado
  public signUp(mail: string, password: string, rol: string) {
    return this.http.post("http://localhost:3000/usuario/signup", {
      mail: mail,
      password: password,
      rol: rol
    });
  }
  //Recibe la duracion en segundo y pone un timer que cuando se cumpla el tiempo desloguea al usuario
  private timerAutenticacion(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

}
