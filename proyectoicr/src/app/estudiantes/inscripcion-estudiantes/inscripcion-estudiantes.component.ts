import { EstudiantesService } from "../estudiante.service";
import { OnInit, Component, Inject } from "@angular/core";
import { Router } from "@angular/router";
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
  MAT_DIALOG_DATA
} from "@angular/material";
import { NgForm } from "@angular/forms";

@Component({
  selector: "app-inscripcion-estudiantes",
  templateUrl: "./inscripcion-estudiantes.component.html",
  styleUrls: ["./inscripcion-estudiantes.component.css"]
})
export class InscripcionEstudianteComponent implements OnInit {
  divisionesXAno: any[];
  divisionesFiltradas: any[];
  anoSeleccionado: string;
  apellidoEstudiante: string;
  nombreEstudiante: string;
  _idEstudiante: string;
  matConfig = new MatDialogConfig();
  anios: number[]= [];
  seleccionDeAnio: boolean = false;

  constructor(public servicio: EstudiantesService, public dialog: MatDialog) {}

  ngOnInit() {
    // this.apellidoEstudiante= this.servicio.estudianteSeleccionado.apellido;
    // this.nombreEstudiante= this.servicio.estudianteSeleccionado.nombre;
    // this._idEstudiante= this.servicio.estudianteSeleccionado._id;
    this.apellidoEstudiante = "Toneta";
    this.nombreEstudiante = "Guillermo";
    this._idEstudiante = "5d27acb4c86bb526180afafa";
    this.servicio.obtenerDivisionesXAño();
    this.servicio.getDivisionXAñoListener().subscribe(divisionesXAño => {
      this.divisionesXAno = divisionesXAño;
      this.divisionesXAno.forEach(element => {
        this.anios.push(element.ano);
      });
      this.anios.sort((a, b) =>
      a > b ? 1 : b > a ? -1 : 0);
    });
  }

  //Filtra las divisiones segun el año seleccionado y las ordena alfanumericamente
  FiltrarDivisiones() {
    this.seleccionDeAnio= true;
    this.divisionesFiltradas = this.divisionesXAno.find(
      divisionXAño => divisionXAño.ano === this.anoSeleccionado
    ).divisiones;
    this.divisionesFiltradas.sort((a, b) =>
    a > b ? 1 : b > a ? -1 : 0);
  }


  openDialogo(tipo: string, form: NgForm, division) {
    this.matConfig.data = {
      tipoPopup: tipo, formValido: form.valid, IdEstudiante: this._idEstudiante, division: division.value };
    this.matConfig.width = "250px";
    this.dialog.open(InscripcionPopupComponent, this.matConfig);
  }
}

@Component({
  selector: "app-inscripcion-popup",
  templateUrl: "./inscripcion-popup.component.html"
})
export class InscripcionPopupComponent {
  tipoPopup: string;
  formValido: boolean;
  IdEstudiante: string;
  division: string;
  exito: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<InscripcionPopupComponent>,
    public router: Router,
    public servicio: EstudiantesService,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.tipoPopup = data.tipoPopup;
    this.formValido= data.formValido;
    this.IdEstudiante= data.IdEstudiante;
    this.division= data.division;
  }

  onYesCancelarClick(): void {
    this.router.navigate(["menuLateral/home"]);
    this.dialogRef.close();
  }

  onNoCancelarConfirmarClick(): void {
    this.dialogRef.close();
  }

  onYesConfirmarClick(): void {
    this.servicio.inscribirEstudiante(this.IdEstudiante, this.division).subscribe(response =>{
      this.exito= response.exito;
    });
    this.tipoPopup = "inscribir";
  }

  onOkConfirmarClick() {
    if (this.formValido && this.exito) {
      this.router.navigate(["menuLateral/home"]);
      this.dialogRef.close();
    }
    this.dialogRef.close();
  }
}
