import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class AgendaService {

  //#resolve Metodo para probar, borrar una vez que este hecho todo
  obtenerMaterias(){
    var materiaObj = {
      nombre: "Matemáticas",
      dia: "Miercoles",
      inicio: "11:30",
      fin: "12:15"
    };

    var materiaObj2 = {
      nombre: "Lengua",
      dia: "Miercoles",
      inicio: "09:15",
      fin: "11:30"
    };

    var materiaObj3 = {
      nombre: "Fisica",
      dia: "Lunes",
      inicio: "07:00",
      fin: "08:30"
    };

    return [materiaObj, materiaObj2, materiaObj3];

  }
}
