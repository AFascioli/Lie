import { Component, OnInit } from "@angular/core";
import { EstudiantesService } from '../estudiante.service';
import { Estudiante } from '../estudiante.model';
import { MatDialogRef, MatDialog } from '@angular/material';

@Component({
  selector: "app-lista-estudiantes",
  templateUrl: "./lista-estudiantes.component.html",
  styleUrls: ["./lista-estudiantes.component.css"]
})
export class ListaEstudiantesComponent implements OnInit {
  dniSeleccionado: number;
  estudiantes: Estudiante[] = [];

  constructor(public servicio: EstudiantesService, public dialog: MatDialog) {}

  ngOnInit() {
    this.servicio.getEstudiantesListener().subscribe(estudiantesBuscados =>{
      this.estudiantes = estudiantesBuscados;
    })
  }

  displayedColumns: string[] = ["apellido", "nombre", "tipo", "numero", "accion"];

  OnSelection(row) {
    this.dniSeleccionado = row.dni;
    console.log(this.dniSeleccionado);
  }

  openDialog(): void {
    this.dialog.open(MostrarPopupComponent, {
      width: "250px"
    });
  }
}

@Component({
  selector: "app-mostrar-popup",
  templateUrl: "./mostrar-popup.component.html"
})
export class MostrarPopupComponent {
  constructor(
        public dialogRef: MatDialogRef<MostrarPopupComponent>
        // Ver para pasar información entre componentes ,@Inject(MAT_DIALOG_DATA) public data: DialogData
      ) {}

      onNoClick(): void {
        this.dialogRef.close();
      }
}
