import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-parametrizar-reglas-negocio',
  templateUrl: './parametrizar-reglas-negocio.component.html',
  styleUrls: ['./parametrizar-reglas-negocio.component.css']
})
export class ParametrizarReglasNegocioComponent implements OnInit {
  horaLlegadaTardeAntes: string;
  horaLlegadaTardeDespues: string;
  horaRetiroAnticipadoAntes: string;
  horaRetiroAnticipadoDespues: string;

  constructor() { }
  ngOnInit(): void {
  }

  onGuardar()
  {

  }
}
