import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MatDialog, MatDialogConfig, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: 'app-documentos-inscripcion',
  templateUrl: './documentos-inscripcion.component.html',
  styleUrls: ['./documentos-inscripcion.component.css']
})
export class DocumentosInscripcionComponent implements OnInit {
  anios: number[]= [];
  divisionesXAno: any[];
  divisionesFiltradas: any[];
  seleccionDeAnio: boolean = false;
  anoSeleccionado: string;
  estudiantesConDocumentos: any[]=[];
  displayedColumns: string[] = ["apellido", "nombre", "fotocopiaDoc", "fichaMed", "informeAnt", "seleccionarTodos"];
  matConfig= new MatDialogConfig();

  constructor(public servicio: EstudiantesService, public popup: MatDialog, private snackBar: MatSnackBar) { }

  ngOnInit() {
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

  //Cuando el usuario selecciona una division, se obtienen los datos del estudiantes necesarios
  onCursoSeleccionado(curso){
    this.servicio.obtenerEstudiantesXCurso(curso.value).subscribe(estudiantes =>{
      this.estudiantesConDocumentos= estudiantes;
    });
  }

  //Cambia el valor del atributo documentoEntregado.entregado del documento seleccionado
  registrarCambioDocumento(estudiante: any, indiceDoc: number){
    estudiante.documentosEntregados[indiceDoc].entregado=!estudiante.documentosEntregados[indiceDoc].entregado;
  }

  //Registra que todos los documentos fueron entregados cuando se selecciona la columna "todos"
  registrarTodosDocumentos(estudiante: any ){
    estudiante.documentosEntregados[0].entregado=true;
    estudiante.documentosEntregados[1].entregado=true;
    estudiante.documentosEntregados[2].entregado=true;
  }

  //Guardar los estudiantes con los cambios, resetea los selects y abre snackBar
  onGuardar(division, anio){
    this.servicio.registrarDocumentosInscripcion(this.estudiantesConDocumentos).subscribe(response =>{
      if(response.exito){
        division.reset();
        anio.reset();
        this.seleccionDeAnio= !this.seleccionDeAnio;
        this.estudiantesConDocumentos= [];
        this.snackBar.open("Se registró correctamente la documentación de los estudiantes", "", {
          duration: 4000,
        });
      }else{
        this.snackBar.open("Ocurrió un problema al tratar de guardar", "", {
          duration: 4500,
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
  templateUrl: "./documentos-inscripcion-popup.component.html"
})
export class DocumentosInscripcionPopupComponent {

  constructor(
    public dialogRef: MatDialogRef<DocumentosInscripcionPopupComponent>,
    public router: Router,
    public servicio: EstudiantesService
  ) {
  }

  onYesCancelarClick(): void {
    this.router.navigate(["menuLateral/home"]);
    this.dialogRef.close();
  }

  onNoCancelarClick(): void {
    this.dialogRef.close();
  }
}
