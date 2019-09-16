import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable()
export class RouteGuard implements CanActivate {
  constructor(private router: Router, private servicio: EstudiantesService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    if(!this.servicio.estudianteSeleccionado){
      this.router.navigate(["/buscar"]);
    }
    return true;
  }
}
