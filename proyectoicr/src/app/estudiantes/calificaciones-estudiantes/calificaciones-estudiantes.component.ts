import { AutenticacionService } from './../../login/autenticacionService.service';
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Component, OnInit } from "@angular/core";
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
  MatSnackBar
} from "@angular/material";
import { Router } from "@angular/router";
import { NgForm } from "@angular/forms";

@Component({
  selector: "app-calificaciones-estudiantes",
  templateUrl: "./calificaciones-estudiantes.component.html",
  styleUrls: ["./calificaciones-estudiantes.component.css"]
})
export class CalificacionesEstudiantesComponent implements OnInit {
  cursos: any[];
  materias: any[];
  estudiantes: any[];
  displayedColumns: string[] = ["apellido", "nombre", "cal1", "cal2", "cal3","cal4", "cal5", "cal6", "prom"];
  trimestrePorDefecto: string;
  rolConPermisosEdicion = false;

  constructor(
    public servicio: EstudiantesService,
    public popup: MatDialog,
    private snackBar: MatSnackBar,
    public servicioAutenticacion: AutenticacionService
  ) {}

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

    this.trimestrePorDefault();
    this.servicioAutenticacion.obtenerPermisosDeRol().subscribe(res => {
      console.log(res);
    })
  }

  trimestrePorDefault()
  {
    var today = new Date();
    var t1 = new Date(2019, 4, 31);
    var t2 = new Date(2019, 8, 15);

    if (today < t1)
    this.trimestrePorDefecto = "1";
    else if(today > t2)
    this.trimestrePorDefecto = "3";
    else
    this.trimestrePorDefecto = "2";
  }

  onCursoSeleccionado(curso) {
    this.servicio.obtenerMateriasXCurso(curso.value).subscribe(respuesta => {
      this.materias = respuesta.materias;
    });
  }

  onMateriaSeleccionada(form: NgForm) {
    this.servicio
      .obtenerEstudiantesXCursoXMateria(
        form.value.curso,
        form.value.materia,
        form.value.trimestre
      )
      .subscribe(respuesta => {
        this.estudiantes = [...respuesta.estudiantes];
      });
  }

  onGuardar(form: NgForm) {
    if (form.invalid) {
      if(form.value.curso == '' || form.value.materia =='')
      {
        this.snackBar.open("Faltan campos por seleccionar", "", {
        duration: 3000
      });
      }
      else{
        this.snackBar.open("Las calificaciones sólo pueden ser números entre 1 y 10.", "", {
          duration: 3000
        });
      }
    } else {
      this.servicio
        .registrarCalificaciones(this.estudiantes, form.value.materia, form.value.trimestre )
        .subscribe(respuesta => {
          if (respuesta.exito) {
            this.snackBar.open(respuesta.message, "", {
              duration: 3000
            });
          }
        });
    }
  }
  contadorNotasValidas(index):number{
  var cont =0;
  this.estudiantes[index].calificaciones.forEach
  (nota => {
    if (nota !=0 && nota != null)
    cont++;
   });
   return cont;
  }

  onCancelar() {
    this.servicio.tipoPopUp = "cancelar";
    this.popup.open(CalificacionesEstudiantePopupComponent);
  }
}

@Component({
  selector: "app-calificaciones-estudiantes",
  templateUrl: "./calificaciones-estudiantes-popup.component.html",
  styleUrls: ["./calificaciones-estudiantes.component.css"]
})
export class CalificacionesEstudiantePopupComponent {
  constructor(
    public dialogRef: MatDialogRef<CalificacionesEstudiantePopupComponent>,
    public router: Router
  ) {}

  onYesCancelarClick(): void {
    this.router.navigate(["./home"]);
    this.dialogRef.close();
  }

  onNoCancelarClick(): void {
    this.dialogRef.close();
  }
}
