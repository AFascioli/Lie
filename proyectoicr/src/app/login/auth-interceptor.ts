import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AutenticacionService } from "./autenticacionService.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private servicio: AutenticacionService) {}

  //Toma cada una de las request que salen hacia el backend y les agrega el token para que puedan ser
  //verificadas
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.servicio.getToken();
    const reqClonada = req.clone({
      headers: req.headers.set("Authorization", "Bearer " + token)
    });
    return next.handle(reqClonada);
  }
}
