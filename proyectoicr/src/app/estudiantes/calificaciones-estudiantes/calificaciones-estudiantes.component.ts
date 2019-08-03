import { EstudiantesService } from 'src/app/estudiantes/estudiante.service';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog, MatDialogConfig, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calificaciones-estudiantes',
  templateUrl: './calificaciones-estudiantes.component.html',
  styleUrls: ['./calificaciones-estudiantes.component.css']
})
export class CalificacionesEstudiantesComponent implements OnInit {
  

  constructor() { }

  ngOnInit() {


  }

onCancelar() {

  }

}
