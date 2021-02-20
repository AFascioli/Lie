import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { AutenticacionService } from "./../../login/autenticacionService.service";
import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { AsistenciaService } from "src/app/asistencia/asistencia.service";
import { MatDialog, MatDialogConfig, MatSnackBar } from "@angular/material";
import { MediaMatcher } from "@angular/cdk/layout";
import { SelectionModel } from "@angular/cdk/collections";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-retiro-anticipado",
  templateUrl: "./retiro-anticipado.component.html",
  styleUrls: ["./retiro-anticipado.component.css"],
})
export class RetiroAnticipadoComponent implements OnInit {
  fechaActual = new Date();
  apellidoEstudiante: string;
  nombreEstudiante: string;
  diaActual: string;
  _idEstudiante: string;
  antes10am: Boolean = true;
  matConfig = new MatDialogConfig();
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;
  fueraPeriodoCicloLectivo: Boolean = false;
  displayedColumns: string[] = [
    "seleccion",
    "apellido",
    "nombre",
    "telefono",
    "tipoDocumento",
    "nroDocumento",
  ];
  tutores: any[] = [];
  seleccion = new SelectionModel(true, []);
  isLoading = true;
  horaRetiroAnticipado: string;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public snackBar: MatSnackBar,
    public servicioEstudiante: EstudiantesService,
    public servicioAsistencia: AsistenciaService,
    public servicioCicloLectivo: CicloLectivoService,
    public dialog: MatDialog,
    public changeDetectorRef: ChangeDetectorRef,
    public autenticacionService: AutenticacionService,
    public media: MediaMatcher,
    public cicloLectivoService: CicloLectivoService
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 800px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  async ngOnInit() {
    this.verificarEstadoCiclo();
    this.servicioCicloLectivo
      .obtenerHoraRetiroAnticipado()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.horaRetiroAnticipado = response.hora;
      });
    if (
      this.fechaActual.toString().substring(0, 3) == "Sat" ||
      this.fechaActual.toString().substring(0, 3) == "Sun"
    ) {
      this.snackBar.open(
        "Considere que está queriendo registrar un retiro anticipado en un fin de semana",
        "",
        {
          panelClass: ["snack-bar-aviso"],
          duration: 8000,
        }
      );
    }
    this.apellidoEstudiante = this.servicioEstudiante.estudianteSeleccionado.apellido;
    this.nombreEstudiante = this.servicioEstudiante.estudianteSeleccionado.nombre;
    this._idEstudiante = this.servicioEstudiante.estudianteSeleccionado._id;
    this.validarHora();
    this.servicioEstudiante
      .getTutoresDeEstudiante()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((respuesta) => {
        this.tutores = respuesta.tutores;
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  //Segun que hora sea, cambia el valor de antes10am y cambia que radio button esta seleccionado
  validarHora() {
    if (this.fechaActual.getHours() >= 10) {
      this.antes10am = false;
    }
  }

  CambiarTipoRetiro() {
    this.antes10am = !this.antes10am;
  }

  verificarEstadoCiclo() {
    this.servicioCicloLectivo
      .obtenerEstadoCicloLectivo()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.fueraPeriodoCicloLectivo = !(
          response.estadoCiclo == "En primer trimestre" ||
          response.estadoCiclo == "En segundo trimestre" ||
          response.estadoCiclo == "En tercer trimestre"
        );
      });
  }

  onGuardar() {
    if (this.tutores.length == 0 || this.seleccion.selected.length > 0) {
      this.servicioAsistencia
        .registrarRetiroAnticipado(
          this._idEstudiante,
          this.antes10am,
          this.seleccion.selected
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((response) => {
          let resultadoOperacion = response.exito;
          if (resultadoOperacion == "exito") {
            this.snackBar.open(response.message, "", {
              panelClass: ["snack-bar-exito"],
              duration: 4500,
            });
          } else {
            this.snackBar.open(response.message, "", {
              panelClass: ["snack-bar-fracaso"],
              duration: 4500,
            });
          }
        });
    } else {
      this.snackBar.open("Debe seleccionar un tutor", "", {
        panelClass: ["snack-bar-fracaso"],
        duration: 4500,
      });
    }
  }
}
