import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { EventosService } from "./eventos/eventos.service";

@Injectable()
export class RouteEventoGuard implements CanActivate {
  constructor(private router: Router, private servicioEvento: EventosService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    if (!this.servicioEvento.eventoSeleccionado) {
      this.router.navigate(["/home"]);
    }
    return true;
  }
}
