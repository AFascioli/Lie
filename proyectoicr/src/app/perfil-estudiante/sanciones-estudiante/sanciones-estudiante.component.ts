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
          this.snackBar.open(respuesta.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 3000
          });
          this.sanciones = respuesta.sanciones;
        }
      });
  }
}
