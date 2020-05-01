import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { MatSnackBar } from "@angular/material";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { MediaMatcher } from '@angular/cdk/layout';

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
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(
    public servicio: EstudiantesService,
    public snackBar: MatSnackBar,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 880px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngOnInit() {
    this.apellidoEstudiante = this.servicio.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicio.estudianteSeleccionado.nombre;
    this.servicio
      .getSancionesDeEstudiante()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(respuesta => {
        if (respuesta.exito) {
          this.sanciones = respuesta.sanciones;
          if (this.sanciones.length != 0) {
            this.calcularSumatoriaSanciones();
          }
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
