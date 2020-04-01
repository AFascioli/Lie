import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AutenticacionService } from "./login/autenticacionService.service";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private router: Router, public servicio: AutenticacionService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    let flag: boolean = false;

    if (route.data.rolesValidos == null) {
      return true;
    }
    route.data.rolesValidos.forEach(rol => {
      if (rol == this.servicio.getRol()) {
        flag = true;
      }
    });
    if (!flag) {
      this.router.navigate(["./home"]);
    }
    return flag;
  }
}
