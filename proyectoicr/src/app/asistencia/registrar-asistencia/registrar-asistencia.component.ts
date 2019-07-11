import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { MatDialogRef, MatDialog } from "@angular/material";
import { DialogoPopupComponent } from "src/app/estudiantes/alta-estudiantes/alta-estudiantes.component";
import { Router } from "@angular/router";

@Component({
  selector: "app-registrar-asistencia",
  templateUrl: "./registrar-asistencia.component.html",
  styleUrls: ["./registrar-asistencia.component.css"]
})
export class RegistrarAsistenciaComponent implements OnInit {
  cursoNotSelected: boolean;
  estudiantesXDivision: any[];
  displayedColumns: string[] = ["apellido", "nombre", "accion"];

  constructor(private servicio: EstudiantesService, public popup: MatDialog) {}

  ngOnInit() {
    this.cursoNotSelected = true;
  }

  //Busca los estudiantes segun el curso que se selecciono en pantalla. Los orden alfabeticamente
  buscarEstudiantesPorDivision(curso) {
    this.cursoNotSelected = false;
    this.servicio.buscarEstudiantesPorDivision(curso.value);
    this.servicio
      .getEstudiantesXDivisionListener()
      .subscribe(estudiantesXDivision => {
        this.estudiantesXDivision = estudiantesXDivision.sort((a, b) =>
          a.apellido > b.apellido ? 1 : b.apellido > a.apellido ? -1 : 0
        );
      });
  }

  //Cambia el atributo presente del estudiante cuando se cambia de valor el toggle
  onCambioPresentismo(row) {
    const indexEstudiante = this.estudiantesXDivision.findIndex(
      objConIDEstudiante => objConIDEstudiante._id == row._id
    );
    this.estudiantesXDivision[indexEstudiante].presente = !this
      .estudiantesXDivision[indexEstudiante].presente;
  }

  //Envia al servicio el vector con los datos de los estudiantes y el presentismo
  onGuardar() {
    this.servicio.registrarAsistencia(this.estudiantesXDivision);
    this.servicio.tipoPopUp = "guardar";
    this.popup.open(AsistenciaPopupComponent, {
      width: "250px"
    });
  }

  onCancelar() {
    this.servicio.tipoPopUp = "cancelar";
    this.popup.open(AsistenciaPopupComponent, {
      width: "250px"
    });
  }
}

@Component({
  selector: "app-asistencia-popup",
  templateUrl: "./asistencia-popup.component.html"
})
export class AsistenciaPopupComponent {
  tipoPopup: string;

  constructor(
    public dialogRef: MatDialogRef<DialogoPopupComponent>,
    public router: Router,
    public servicio: EstudiantesService
  ) {
    this.tipoPopup = this.servicio.tipoPopUp;
  }

  // Se cierra el popup
  onOkClick(): void {
    this.dialogRef.close();
  }

  onYesClick(): void {
    this.router.navigate(["menuLateral/home"]);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
