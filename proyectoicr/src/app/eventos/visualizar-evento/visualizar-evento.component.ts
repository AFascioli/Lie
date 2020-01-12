import { Component, OnInit } from '@angular/core';
import { EventosService } from '../eventos.service';
import { Evento } from '../evento.model';

@Component({
  selector: 'app-visualizar-evento',
  templateUrl: './visualizar-evento.component.html',
  styleUrls: ['./visualizar-evento.component.css']
})
export class VisualizarEventoComponent implements OnInit {
  evento: Evento;

  constructor(public eventoService: EventosService) { }

  ngOnInit() {
    this.evento = this.eventoService.eventoSeleccionado;
  }

  getImage(imgUrl){
    return require("backend/images/"+imgUrl)
  }

  obtenerMes(fechaEvento){
    let fecha = new Date(fechaEvento);
    let rtdoMes= fecha.toLocaleString('es-ES', { month: 'long' });
    return rtdoMes.charAt(0).toUpperCase()+rtdoMes.slice(1);
  }

  obtenerDia(fechaEvento){
    let fecha = new Date(fechaEvento);
    return fecha.getDate();
  }



}
