import { EventosService } from './../eventos/eventos.service';
import { AutenticacionService } from "./../login/autenticacionService.service";
import { Component, OnInit } from "@angular/core";
import { AdultoResponsableService } from "../adulto-responsable/adultoResponsable.service";

@Component({
  selector: "app-menu-principal-ar",
  templateUrl: "./menu-principal-ar.component.html",
  styleUrls: ["./menu-principal-ar.component.css"]
})
export class MenuPrincipalARComponent implements OnInit {
  estudiantes;
  eventos;
  constructor(
    public authService: AutenticacionService,
    public servicioAR: AdultoResponsableService,
    public servicioEvento: EventosService
  ) {}

  ngOnInit() {
    let cursos = [];
    this.servicioAR
      .getDatosEstudiantes(this.authService.getId())
      .subscribe(response => {
        this.estudiantes = response.estudiantes;
        this.estudiantes.forEach(estudiante => {
          cursos.push(estudiante.curso);
        });
        this.servicioEvento.obtenerEventosDeCursos(cursos.join(",")).subscribe(response => {
           this.eventos=response.eventos;
           console.log(this.eventos);
        });
      });
  }

  obtenerMes(fechaEvento) {
    let fecha = new Date(fechaEvento);
    let rtdoMes = fecha.toLocaleString("es-ES", { month: "long" });
    console.log(fechaEvento);
    return rtdoMes.charAt(0).toUpperCase() + rtdoMes.slice(1);
  }

  obtenerDia(fechaEvento) {
    let fecha = new Date(fechaEvento);
    return fecha.getDate();
  }
}
