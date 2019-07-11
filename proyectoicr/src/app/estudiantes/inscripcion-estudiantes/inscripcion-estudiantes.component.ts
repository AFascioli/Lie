import { EstudiantesService } from "../estudiante.service";
import { OnInit, Component } from "@angular/core";

@Component({
  selector: "app-inscripcion-estudiantes",
  templateUrl: "./inscripcion-estudiantes.component.html",
  styleUrls: ["./inscripcion-estudiantes.component.css"]
})
export class InscripcionEstudianteComponent implements OnInit {
  divisionesXAno: any[];
  divisionesFiltradas: any[];
  anoSeleccionado: string;
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;

  constructor(public servicio: EstudiantesService) {}


  ngOnInit() {
    // this.apellidoEstudiante= this.servicio.estudianteSeleccionado.apellido;
    // this.nombreEstudiante= this.servicio.estudianteSeleccionado.nombre;
    // this._idEstudiante= this.servicio.estudianteSeleccionado._id;
    this.apellidoEstudiante="Toneta";
    this.nombreEstudiante= "Guillermo";
    this._idEstudiante= "5d27acb4c86bb526180afafa";
    this.servicio.obtenerDivisionesXAño();
    this.servicio.getDivisionXAñoListener().subscribe(divisionesXAño => {
      this.divisionesXAno = divisionesXAño;
    });
  }

  FiltrarDivisiones(){
    this.divisionesFiltradas = this.divisionesXAno.find(
          divisionXAño => divisionXAño.ano === this.anoSeleccionado
        ).divisiones;
  }

  onInscribir(division){
    this.servicio.inscribirEstudiante(this._idEstudiante, division.value)
  }
}
