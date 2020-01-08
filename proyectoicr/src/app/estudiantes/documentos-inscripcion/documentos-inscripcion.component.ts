import { AutenticacionService } from 'src/app/login/autenticacionService.service';
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Component, OnInit } from "@angular/core";
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
  MatSnackBar
} from "@angular/material";
import { Router } from "@angular/router";

@Component({
  selector: "app-documentos-inscripcion",
  templateUrl: "./documentos-inscripcion.component.html",
  styleUrls: ["./documentos-inscripcion.component.css"]
})
export class DocumentosInscripcionComponent implements OnInit {
  cursos: any[];
  cursoSeleccionado: boolean = false;
  estudiantesConDocumentos: any[] = [];
  displayedColumns: string[] = [
    "apellido",
    "nombre",
    "fotocopiaDoc",
    "fichaMed",
    "informeAnt"
  ];
  matConfig = new MatDialogConfig();
  documentosEntregadosOnChange = false;
  fueraPeriodoCicloLectivo = false;
  fechaActual: Date;

  constructor(
    public servicio: EstudiantesService,
    public autenticacionService: AutenticacionService,
    public popup: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  //Sort ordena solo por año de curso, para ordenar bien, deberia dsp de el sort que esta ahora
  //tomar de a dos cursos y ordenarlos alfabeticamente, de esa forma quedan ordenados por año y
  //division
  ngOnInit() {
    this.fechaActual = new Date();
      if (this.fechaActualEnCicloLectivo() || this.autenticacionService.getRol()=="Admin") {
        this.servicio.obtenerCursos().subscribe(response => {
          this.cursos = response.cursos;
          this.cursos.sort((a, b) =>
            a.curso.charAt(0) > b.curso.charAt(0)
              ? 1
              : b.curso.charAt(0) > a.curso.charAt(0)
              ? -1
              : 0
          );
        });
      } else {
        this.fueraPeriodoCicloLectivo = true;

      }

  }

  fechaActualEnCicloLectivo() {
    let fechaInicioInscripcion = new Date(
      this.autenticacionService.getFechasCicloLectivo().fechaInicioInscripcion
    );
    let fechaFinTercerTrimestre = new Date(
      this.autenticacionService.getFechasCicloLectivo().fechaFinTercerTrimestre
    );

    return (
      this.fechaActual.getTime() > fechaInicioInscripcion.getTime() &&
      this.fechaActual.getTime() < fechaFinTercerTrimestre.getTime()
    );
  }

  //Cuando el usuario selecciona una division, se obtienen los datos del estudiantes necesarios
  onCursoSeleccionado(curso) {
    this.cursoSeleccionado = true;
    this.servicio
      .obtenerDocumentosDeEstudiantesXCurso(curso.value)
      .subscribe(estudiantes => {
        this.estudiantesConDocumentos = estudiantes.documentos;
        this.estudiantesConDocumentos = this.estudiantesConDocumentos.sort(
          (a, b) =>
            a.datosEstudiante[0].apellido > b.datosEstudiante[0].apellido
              ? 1
              : b.datosEstudiante[0].apellido > a.datosEstudiante[0].apellido
              ? -1
              : 0
        );
      });
    this.documentosEntregadosOnChange = false;
  }

  //Cambia el valor del atributo documentoEntregado.entregado del documento seleccionado
  registrarCambioDocumento(estudiante: any, indiceDoc: number) {
    estudiante.documentosEntregados[indiceDoc].entregado = !estudiante
      .documentosEntregados[indiceDoc].entregado;
    this.documentosEntregadosOnChange = true;
  }

  //Guardar los estudiantes con los cambios, resetea los selects y abre snackBar
  onGuardar() {
    this.servicio
      .registrarDocumentosInscripcion(this.estudiantesConDocumentos)
      .subscribe(response => {
        if (response.exito) {
          this.snackBar.open(
            "Se registró correctamente la documentación de los estudiantes",
            "",
            {
              panelClass: ["snack-bar-exito"],
              duration: 4000
            }
          );
        } else {
          this.snackBar.open("Ocurrió un problema al tratar de guardar", "", {
            panelClass: ["snack-bar-fracaso"],
            duration: 4500
          });
        }
      });
  }

  onCancelar() {
    this.popup.open(DocumentosInscripcionPopupComponent, {
      width: "250px"
    });
  }
}

@Component({
  selector: "app-documentos-inscripcion-popup",
  templateUrl: "./documentos-inscripcion-popup.component.html",
  styleUrls: ["./documentos-inscripcion.component.css"]
})
export class DocumentosInscripcionPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<DocumentosInscripcionPopupComponent>,
    public router: Router,
    public servicio: EstudiantesService
  ) {}

  onYesCancelarClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  onNoCancelarClick(): void {
    this.dialogRef.close();
  }
}
