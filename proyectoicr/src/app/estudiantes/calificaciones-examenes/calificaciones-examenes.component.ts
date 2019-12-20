import { MatSnackBar } from "@angular/material";
import { AutenticacionService } from "./../../login/autenticacionService.service";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
  selector: "app-calificaciones-examenes",
  templateUrl: "./calificaciones-examenes.component.html",
  styleUrls: ["./calificaciones-examenes.component.css"]
})
export class CalificacionesExamenesComponent implements OnInit {
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  fechaActual: Date;
  fechaDentroDeRangoExamen: boolean = false;
  materiasDesaprobadas: any[];
  idMateriaSeleccionada: string;
  tieneMateriasDesaprobadas: boolean = false;
  notaExamen: any;

  constructor(
    public estudianteService: EstudiantesService,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher,
    public authService: AutenticacionService,
    public snackBar: MatSnackBar
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 1000px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    this.apellidoEstudiante = this.estudianteService.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.estudianteService.estudianteSeleccionado.nombre;
    this.estudianteService.obtenerMateriasDesaprobadasEstudiante().subscribe(materias =>{
      if(materias.materiasDesaprobadas.length != 0){
        this.materiasDesaprobadas= materias.materiasDesaprobadas;
        this.tieneMateriasDesaprobadas = true;
      }
    });
    this.fechaActual = new Date();
    if (this.fechaActualEnRangoFechasExamenes() || this.authService.getRol()=="Admin") {
      this.fechaDentroDeRangoExamen = true;
      this.fechaActualFinDeSemana();
    }
  }

  onMateriaChange(idMateria){
    this.idMateriaSeleccionada= idMateria;
    console.log(idMateria);
  }

  checkNotas(event) {
    var inputValue = event.which;
    var concat = this.notaExamen + String.fromCharCode(inputValue);
    if (
      !(inputValue >= 48 && inputValue <= 57) &&
      inputValue != 32 &&
      inputValue != 0
    )
      event.preventDefault();
    else if (this.notaExamen!= "" && Number(concat) > 10) event.preventDefault();
  }

  fechaActualFinDeSemana() {
    if (
      this.fechaActual.toString().substring(0, 3) == "Sat" ||
      this.fechaActual.toString().substring(0, 3) == "Sun"
    ) {
      this.snackBar.open(
        "Considere que está queriendo registrar una calificación de examen en un fin de semana",
        "",
        {
          panelClass: ["snack-bar-aviso"],
          duration: 8000
        }
      );
    }
  }

  fechaActualEnRangoFechasExamenes() {
    let fechaInicioExamen = new Date(
      this.authService.getFechasCicloLectivo().fechaInicioExamen
    );
    let fechaFinExamen = new Date(
      this.authService.getFechasCicloLectivo().fechaFinExamen
    );

    return (
      this.fechaActual.getTime() > fechaInicioExamen.getTime() &&
      this.fechaActual.getTime() < fechaFinExamen.getTime()
    );
  }

  guardar() {
    if(this.notaExamen>5){
      this.estudianteService.registrarCalificacionExamen(this.idMateriaSeleccionada, this.notaExamen).subscribe(rtdo => {
        if (rtdo.exito) {
          this.snackBar.open(rtdo.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 3000
          });
        }else{
          this.snackBar.open(rtdo.message, "", {
            panelClass: ["snack-bar-fracaso"],
            duration: 3000
          });
        }
      });
    }
  }

}
