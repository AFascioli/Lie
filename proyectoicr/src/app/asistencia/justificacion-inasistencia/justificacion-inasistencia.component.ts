import { Component, OnInit } from '@angular/core';
import { DateAdapter} from "@angular/material";

@Component({
  selector: 'app-justificacion-inasistencia',
  templateUrl: './justificacion-inasistencia.component.html',
  styleUrls: ['./justificacion-inasistencia.component.css']
})
export class JustificacionInasistenciaComponent implements OnInit {
  maxDate = new Date();

  constructor(
    private dateAdapter: DateAdapter<Date>,
  ) { }

  ngOnInit() {
  }

}
