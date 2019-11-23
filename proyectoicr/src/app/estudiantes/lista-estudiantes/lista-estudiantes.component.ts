import { AutenticacionService } from './../../login/autenticacionService.service';
import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "../estudiante.service";
import { Estudiante } from "../estudiante.model";
import { Router } from "@angular/router";

@Component({
  selector: "app-lista-estudiantes",
  templateUrl: "./lista-estudiantes.component.html",
  styleUrls: ["./lista-estudiantes.component.css"]
})
export class ListaEstudiantesComponent implements OnInit {
  dniSeleccionado: number;
  estudiantes: Estudiante[] = [];
  displayedColumns: string[] = ["apellido", "nombre", "tipo", "numero", "accion"];
  permisos={
    notas:0,
    asistencia:0,
    eventos:0,
    sanciones:0,
    agendaCursos:0,
    inscribirEstudiante:0,
    registrarEmpleado:0,
    cuotas:0
  };
  isLoading: boolean = true;


  constructor(public servicio: EstudiantesService, public router: Router, public authService: AutenticacionService) {}

  ngOnInit() {
    if(this.servicio.retornoDesdeAcciones= false){
      this.isLoading=true;
    }else{
       this.servicio.getEstudiantesListener().subscribe(estudiantesBuscados => {
      this.estudiantes = estudiantesBuscados;
      this.isLoading= false;
    });

    if (this.servicio.retornoDesdeAcciones) {
      this.servicio.retornoDesdeAcciones = false;
    }
    this.authService.obtenerPermisosDeRol().subscribe(response=>{
      this.permisos=response.permisos;
    });
    }

  }



  onInscribir(indice) {
    this.servicio.estudianteSeleccionado = this.estudiantes.find(
      estudiante =>
        estudiante.numeroDocumento === this.estudiantes[indice].numeroDocumento
    );
    this.router.navigate(["./curso"]);
    this.servicio.retornoDesdeAcciones = true;
  }

  onMostrar(indice) {
    this.servicio.estudianteSeleccionado = this.estudiantes.find(
      estudiante =>
        estudiante.numeroDocumento === this.estudiantes[indice].numeroDocumento
    );
    this.router.navigate(["./mostrar"]);
    this.servicio.retornoDesdeAcciones = true;
  }

  onRetiro(indice) {
    this.servicio.estudianteSeleccionado = this.estudiantes.find(
      estudiante =>
        estudiante.numeroDocumento === this.estudiantes[indice].numeroDocumento
    );
    this.router.navigate(["./retiroAnticipado"]);
    this.servicio.retornoDesdeAcciones = true;
  }

  onLlegadaTarde(indice) {
    this.servicio.estudianteSeleccionado = this.estudiantes.find(
      estudiante =>
        estudiante.numeroDocumento === this.estudiantes[indice].numeroDocumento
    );
    this.router.navigate(["./llegadaTarde"]);
    this.servicio.retornoDesdeAcciones = true;
  }

  onVisualizarPerfil(indice) {
    this.servicio.estudianteSeleccionado = this.estudiantes.find(
      estudiante =>
        estudiante.numeroDocumento === this.estudiantes[indice].numeroDocumento
    );
    this.router.navigate(["./perfilEstudiante"]);
    this.servicio.retornoDesdeAcciones = true;
  }

  onJustificar(indice){
    this.servicio.estudianteSeleccionado = (this.estudiantes.find(estudiante => estudiante.numeroDocumento===this.estudiantes[indice].numeroDocumento));
    this.router.navigate(["./justificarInasistencia"]);
    this.servicio.retornoDesdeAcciones=true;
  }

  onVRegistrarAR(indice){
    this.servicio.estudianteSeleccionado = (this.estudiantes.find(estudiante => estudiante.numeroDocumento===this.estudiantes[indice].numeroDocumento));
    this.router.navigate(["./altaAdultoResponsable"]);
    this.servicio.retornoDesdeAcciones=true;
  }
}
