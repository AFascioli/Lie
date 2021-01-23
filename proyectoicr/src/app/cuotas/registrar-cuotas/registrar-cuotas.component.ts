import { CicloLectivoService } from "./../../cicloLectivo.service";
import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatSnackBar, MatDialog } from "@angular/material";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { CuotasService } from "../cuotas.service";
import { CancelPopupComponent } from "src/app/popup-genericos/cancel-popup.component";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-registrar-cuotas",
  templateUrl: "./registrar-cuotas.component.html",
  styleUrls: ["./registrar-cuotas.component.css"],
})
export class RegistrarCuotasComponent implements OnInit, OnDestroy {
  constructor(
    public autenticacionService: AutenticacionService,
    public servicioEstudiante: EstudiantesService,
    public servicioCicloLectivo: CicloLectivoService,
    public cuotasService: CuotasService,
    public popup: MatDialog,
    public snackBar: MatSnackBar,
    public cicloLectivoService: CicloLectivoService
  ) {}

  mesSeleccionado: any;
  fechaActual: Date;
  fueraPeriodoCicloLectivo: Boolean = false;
  cursos: any[];
  cursoEstudiante: any;
  meses: string[] = [
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  cursoNotSelected: Boolean = true;
  cuotasXEstudiante: any[] = [];
  displayedColumns: string[] = ["apellido", "nombre", "accion"];
  isLoading: Boolean = false;
  aniosCiclos;
  private unsubscribe: Subject<void> = new Subject();

  async ngOnInit() {
    this.fechaActual = new Date();
    this.servicioCicloLectivo
      .obtenerActualYSiguiente()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.aniosCiclos = response.añosCiclos;
      });
    if (
      this.fechaActual.toString().substring(0, 3) == "Sat" ||
      this.fechaActual.toString().substring(0, 3) == "Sun"
    ) {
      this.snackBar.open(
        "Considere que está queriendo registrar el estado de las cuotas en un fin de semana",
        "",
        {
          panelClass: ["snack-bar-aviso"],
          duration: 4000,
        }
      );
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  //Busca los estudiantes segun el curso que se selecciono en pantalla. Los orden alfabeticamente
  onCursoSeleccionado(curso, mes) {
    this.isLoading = true;
    let nroMes: any = 0;
    for (let i = 0; i < this.meses.length; i++) {
      if (mes.value == this.meses[i]) {
        nroMes = i + 1;
        break;
      }
    }
    this.cuotasService
      .obtenerEstadoCuotasDeCurso(curso.value, nroMes + 2)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rtdo) => {
        if (rtdo.cuotasXEstudiante.length != 0) {
          this.cuotasXEstudiante = rtdo.cuotasXEstudiante.sort((a, b) =>
            a.apellido.toLowerCase() > b.apellido.toLowerCase()
              ? 1
              : b.apellido.toLowerCase() > a.apellido.toLowerCase()
              ? -1
              : 0
          );
        } else {
          this.cuotasXEstudiante = [];
        }
        this.isLoading = false;
        this.cursoNotSelected = false;
      });
  }

  //Cambia el atributo presente del estudiante cuando se cambia de valor el toggle
  onCambioEstadoCuota(row) {
    const indexEstudiante = this.cuotasXEstudiante.findIndex(
      (objConIDEstudiante) => objConIDEstudiante._id == row._id
    );
    this.cuotasXEstudiante[indexEstudiante].pagado = !this.cuotasXEstudiante[
      indexEstudiante
    ].pagado;
    this.cuotasXEstudiante[indexEstudiante].changed = true;
  }

  async fechaActualEnPeriodoCursado() {
    return new Promise((resolve, reject) => {
      this.cicloLectivoService.validarEnCursado().subscribe((result) => {
        resolve(result.permiso);
      });
    });
  }

  //Al seleccionar el mes obtiene todos los cursos y los ordena alfabeticamente
  onMesSeleccionado(mes) {
    this.cursoNotSelected = true;
    this.mesSeleccionado = mes.value;

    this.servicioEstudiante
      .obtenerCursos(this.aniosCiclos[0])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.cursos = response.cursos;
        this.cursos.sort((a, b) =>
          a.nombre.charAt(0) > b.nombre.charAt(0)
            ? 1
            : b.nombre.charAt(0) > a.nombre.charAt(0)
            ? -1
            : 0
        );
      });
    this.cursoEstudiante = "";
  }

  onGuardar() {
    let cuotasCambiadas = [];
    this.cuotasXEstudiante.forEach((cuota) => {
      if (cuota.changed == true) {
        cuotasCambiadas.push(cuota);
      }
    });
    this.cuotasService
      .publicarEstadoCuotasDeCurso(cuotasCambiadas)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rtdo) => {
        if (cuotasCambiadas.length == 0) {
          this.snackBar.open(
            "No se ha realizado ninguna modificación en las cuotas",
            "",
            {
              panelClass: ["snack-bar-fracaso"],
              duration: 3000,
            }
          );
        } else {
          this.snackBar.open(rtdo.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 3000,
          });
        }
      });
  }

  onCancelar() {
    this.popup.open(CancelPopupComponent);
  }
}
