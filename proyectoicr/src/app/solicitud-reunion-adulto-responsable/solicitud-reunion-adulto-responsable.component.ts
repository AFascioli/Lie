import { Component, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AdultoResponsableService } from "../adulto-responsable/adultoResponsable.service";

@Component({
  selector: "app-solicitud-reunion-adulto-responsable",
  templateUrl: "./solicitud-reunion-adulto-responsable.component.html",
  styleUrls: ["./solicitud-reunion-adulto-responsable.component.css"],
})
export class SolicitudReunionAdultoResponsableComponent implements OnInit {
  private unsubscribe: Subject<void> = new Subject();
  docentes;
  displayedColumns: string[] = ["apellido", "nombre","materia", "notificar"];
  constructor(
    public snackBar: MatSnackBar,
    public servicioAR: AdultoResponsableService
  ) {}

  ngOnInit() {
    this.servicioAR
      .getDocentesDeEstudiante()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((respuesta) => {
        this.docentes = respuesta.docentes;
        this.docentes.sort(function (a, b) {
          return a.apellido.charAt(0) > b.apellido.charAt(0)
            ? 1
            : b.apellido.charAt(0) > a.apellido.charAt(0)
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
    // this.servicio
    //   .notificarReunionAR(
    //     this.adultosResponsables,
    //     cuerpo.value,
    //     this.servicioAutenticacion.getId()
    //   )
    //   .pipe(takeUntil(this.unsubscribe))
    //   .subscribe((respuesta) => {
    //     if (respuesta.exito) {
    //       this.snackBar.open(respuesta.message, "", {
    //         panelClass: ["snack-bar-exito"],
    //         duration: 4500,
    //       });
    //     } else {
    //       this.snackBar.open(respuesta.message, "", {
    //         panelClass: ["snack-bar-fracaso"],
    //         duration: 4500,
    //       });
    //     }
    //   });
  }

  //Solo se puede seleccionar un docente para enviarle notificacion
  onSeleccionado(index:number){
    this.docentes.forEach(docente => docente.seleccionado && (docente.seleccionado= !docente.seleccionado));
    this.docentes[index].seleccionado=true;
  }
}
