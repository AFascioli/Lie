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

  constructor(
    public servicio: EstudiantesService,
    public popup: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  //Sort ordena solo por año de curso, para ordenar bien, deberia dsp de el sort que esta ahora
  //tomar de a dos cursos y ordenarlos alfabeticamente, de esa forma quedan ordenados por año y
  //division
  ngOnInit() {
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
  }

  //Cuando el usuario selecciona una division, se obtienen los datos del estudiantes necesarios
  onCursoSeleccionado(curso) {
    this.cursoSeleccionado = true;
    this.servicio
      .obtenerEstudiantesXCurso(curso.value)
      .subscribe(estudiantes => {
        this.estudiantesConDocumentos = estudiantes;
      });
  }

  //Cambia el valor del atributo documentoEntregado.entregado del documento seleccionado
  registrarCambioDocumento(estudiante: any, indiceDoc: number) {
    estudiante.documentosEntregados[indiceDoc].entregado = !estudiante
      .documentosEntregados[indiceDoc].entregado;
  }

  //Guardar los estudiantes con los cambios, resetea los selects y abre snackBar
  onGuardar(curso) {
    this.servicio
      .registrarDocumentosInscripcion(this.estudiantesConDocumentos)
      .subscribe(response => {
        if (response.exito) {
          curso.reset();
          this.estudiantesConDocumentos = [];
          this.snackBar.open(
            "Se registró correctamente la documentación de los estudiantes",
            "",
            {
              duration: 4000
            }
          );
        } else {
          this.snackBar.open("Ocurrió un problema al tratar de guardar", "", {
            duration: 4500
          });
        }
      });
  }

  onCancelar() {
    this.popup.open(DocumentosInscripcionPopupComponent);
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
