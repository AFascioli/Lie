import { OnDestroy } from "@angular/core";
import { EstudiantesService } from "../../estudiantes/estudiante.service";
import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-tutores-estudiante",
  templateUrl: "./tutores-estudiante.component.html",
  styleUrls: ["./tutores-estudiante.component.css"],
})
export class TutoresEstudianteComponent implements OnInit, OnDestroy {
  tutores: any[] = [];
  private unsubscribe: Subject<void> = new Subject();
  displayedColumns: string[] = ["apellido", "nombre", "numeroDocumento", "telefono", "email"];
  apellidoEstudiante: string;
  nombreEstudiante: string;
  isLoading=false;

  constructor(public servicio: EstudiantesService) {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit() {
    this.isLoading=true;
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this.servicio
      .getTutoresDeEstudiante()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((respuesta) => {
        this.isLoading=false;
        this.tutores = respuesta.tutores;
      });
  }
}
