import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "../estudiantes/estudiante.service";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { MatSnackBar } from "@angular/material";
import { AutenticacionService } from "../login/autenticacionService.service";

@Component({
  selector: "app-solicitud-reunion",
  templateUrl: "./solicitud-reunion.component.html",
  styleUrls: ["./solicitud-reunion.component.css"],
})
export class SolicitudReunionComponent implements OnInit {
  private unsubscribe: Subject<void> = new Subject();
  adultosResponsables = [];
  displayedColumns: string[] = ["apellido", "nombre", "notificar"];
  constructor(
    public servicio: EstudiantesService,
    public servicioAutenticacion: AutenticacionService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.servicio
      .getARDeEstudiante()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((respuesta) => {
        this.adultosResponsables = respuesta.adultosResponsables;
        this.adultosResponsables.sort(function (a, b) {
          return a.nombre.charAt(0) > b.nombre.charAt(0)
            ? 1
            : b.nombre.charAt(0) > a.nombre.charAt(0)
            ? -1
            : 0;
        });
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onEnviar(cuerpo) {
    this.servicio
      .notificarReunionAR(
        this.adultosResponsables,
        cuerpo.value,
        this.servicioAutenticacion.getId()
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((respuesta) => {
        if (respuesta.exito) {
          this.snackBar.open(respuesta.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
        } else {
          this.snackBar.open(respuesta.message, "", {
            panelClass: ["snack-bar-fracaso"],
            duration: 4500,
          });
        }
      });
  }
}
