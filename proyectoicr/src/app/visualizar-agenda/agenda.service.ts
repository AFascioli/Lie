import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class AgendaService {

  constructor(public http: HttpClient){}

  //Retorna todas las materias de la institucion
  public obtenerMaterias(){
    return this.http.get<{materias: any[]}>(environment.apiUrl+"/materia");
  }

  //Retorna todos los docentes de la institucion
  public obtenerDocentes(){
    return this.http.get<{docentes: any[]}>(environment.apiUrl+"/empleado/docente");
  }
}
