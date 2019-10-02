import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { AutenticacionService } from "./autenticacionService.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private servicio: AutenticacionService, private router: Router) {}

  //Este metodo se ejecuta en las rutas protegidas (fijarse en app-routing).
  //Si el usuario esta autenticado, lo deja pasar, sino lo manda al login
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    const isAuth = this.servicio.getIsAuth();
    if (!isAuth) {
      this.router.navigate(['/login']);
    }
    return isAuth;
  }
}
