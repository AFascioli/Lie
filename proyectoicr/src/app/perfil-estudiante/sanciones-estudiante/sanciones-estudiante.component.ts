import { Component, OnInit, OnDestroy } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { MatSnackBar } from "@angular/material";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-sanciones-estudiante",
  templateUrl: "./sanciones-estudiante.component.html",
  styleUrls: ["./sanciones-estudiante.component.css"]
})
export class SancionesEstudianteComponent implements OnInit, OnDestroy {
  sanciones: any[] = [];
  private unsubscribe: Subject<void> = new Subject();
  displayedColumns: string[] = ["fecha", "tipoSancion", "cantidad"];

  sumatoriaSanciones = [0, 0, 0, 0];
  apellidoEstudiante: string;
  nombreEstudiante: string;

  constructor(
    public servicio: EstudiantesService,
    public snackBar: MatSnackBar
  ) {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit() {
    this.servicio
      .getSancionesDeEstudiante()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(respuesta => {
        if (respuesta.exito) {
          this.sanciones = respuesta.sanciones;
          if (this.sanciones.length != 0) {
            this.calcularSumatoriaSanciones();
          }
          this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
          this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
        }
      });
  }

  calcularSumatoriaSanciones() {
    this.sanciones.forEach(sancion => {
      switch (sancion.tipo) {
        case "Llamado de atencion":
          this.sumatoriaSanciones[0] += sancion.cantidad;
          break;
        case "Apercibimiento":
          this.sumatoriaSanciones[1] += sancion.cantidad;
          break;
        case "Amonestacion":
          this.sumatoriaSanciones[2] += sancion.cantidad;
          break;
        case "Suspencion":
          this.sumatoriaSanciones[3] += sancion.cantidad;
          break;
      }
    });
  }
}
