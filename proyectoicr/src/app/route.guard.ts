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
export class RouteGuard implements CanActivate {
  constructor(
    private router: Router,
    private servicioEstudiante: EstudiantesService,
    private servicioEvento: EventosService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    if (!this.servicioEstudiante.estudianteSeleccionado) {
      this.router.navigate(["/buscar"]);
    }
    return true;
  }
}
