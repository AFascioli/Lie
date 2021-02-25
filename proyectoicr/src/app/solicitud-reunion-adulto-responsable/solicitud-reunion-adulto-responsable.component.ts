import { Component, OnInit } from "@angular/core";
import { MatSnackBar, MatCheckboxChange } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AdultoResponsableService } from "../adulto-responsable/adultoResponsable.service";
import { AutenticacionService } from "../login/autenticacionService.service";
import { NgForm } from "@angular/forms";

@Component({
  selector: "app-solicitud-reunion-adulto-responsable",
  templateUrl: "./solicitud-reunion-adulto-responsable.component.html",
  styleUrls: ["./solicitud-reunion-adulto-responsable.component.css"],
})
export class SolicitudReunionAdultoResponsableComponent implements OnInit {
  private unsubscribe: Subject<void> = new Subject();
  docentes;
  displayedColumns: string[] = ["apellido", "nombre", "materia", "notificar"];
  cuerpoNotificacion;
  constructor(
    public snackBar: MatSnackBar,
    public servicioAR: AdultoResponsableService,
    public servicioAutenticacion: AutenticacionService
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
 
  onEnviar(form: NgForm) {
    let docenteSeleccionado = this.docentes.filter(
      (docente) => docente.seleccionado
    );
    if (this.validarCampos(form.value.cuerpo, docenteSeleccionado)) {
      this.servicioAR
        .validarNotificacion(
          docenteSeleccionado[0].idUsuario,
          this.servicioAutenticacion.getId()
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          if (response.exito) {
            this.servicioAR
              .notificarReunionDocente(
                docenteSeleccionado[0].idUsuario,
                form.value.cuerpo,
                this.servicioAutenticacion.getId()
              )
              .pipe(takeUntil(this.unsubscribe))
              .subscribe((respuesta) => {
                if (respuesta.exito) {
                  this.cuerpoNotificacion = "";
                  docenteSeleccionado[0].seleccionado = false;
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
          } else {
            this.snackBar.open(
              "Deben pasar al menos 7 días de la última solicitud realizada a dicho docente.",
              "",
              {
                panelClass: ["snack-bar-fracaso"],
                duration: 4500,
              }
            );
          }
        });
    }
  }

  validarCampos(cuerpo, docenteSeleccionado) {
    if (cuerpo && docenteSeleccionado.length > 0) {
      return true;
    } else {
      this.snackBar.open(
        "Por favor seleccione un docente y escriba una descripción de la notificación",
        "",
        {
          panelClass: ["snack-bar-fracaso"],
          duration: 4500,
        }
      );
      return false;
    }
  }

  //Solo se puede seleccionar un docente para enviarle notificacion
  onSeleccionado(index: number, event: MatCheckboxChange) {
    this.docentes.forEach(
      (docente) =>
        docente.seleccionado && (docente.seleccionado = !docente.seleccionado)
    );
    this.docentes[index].seleccionado = event.checked;
  }
}
