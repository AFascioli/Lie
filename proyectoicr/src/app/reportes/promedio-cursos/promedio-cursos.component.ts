import { Component, OnInit, ViewChild } from "@angular/core";
import { MatAccordion } from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ReportesService } from "../reportes.service";

@Component({
  selector: "app-promedio-cursos",
  templateUrl: "./promedio-cursos.component.html",
  styleUrls: ["./promedio-cursos.component.css"],
})
export class PromedioCursosComponent implements OnInit {
  @ViewChild(MatAccordion, { static: true }) accordion: MatAccordion;
  private unsubscribe: Subject<void> = new Subject();
  isLoading = false;
  promediosAnios = [];
  displayedColumns: string[] = ["materia", "promedio"];

  constructor(private serviceReporte: ReportesService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.serviceReporte
      .obtenerPromedioCursos()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        if (response.exito) {
          this.sacarPromedioAnio(response.arrayCursos);
        } else {
          //Ver que hacer
        }
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }


  //Crea un array que tiene 
  //  {anio: 1, promedioAnio: 6,4, 
  //   divisiones: [ {nombreCurso: "name",
   //                 promedioGral: 9,
   //                 materias:[{
   //                  nombreMateria: "Name",
   //                  promedioMateria:9}]
   //                } ]}
  //
  sacarPromedioAnio(cursosYPromedios) {
    this.promediosAnios=[{
      anio: 1,
      divisiones:[],
      promedioAnio:0
    },{
      anio: 2,
      divisiones:[],
      promedioAnio:0
    },{
      anio: 3,
      divisiones:[],
      promedioAnio:0
    },{
      anio: 4,
      divisiones:[],
      promedioAnio:0
    },{
      anio: 5,
      divisiones:[],
      promedioAnio:0
    },{
      anio: 6,
      divisiones:[],
      promedioAnio:0
    },]
    for (const curso of cursosYPromedios) {
      for (const cursoFrontend of this.promediosAnios) {
        //Si el curso es del mismo año
        if (
          parseInt(curso.nombreCurso[0]) ==
          cursoFrontend.anio
        ) {
          //Si es de la division A va primero en el array
          if(curso.nombreCurso[1]=="A"){
            cursoFrontend.divisiones.unshift(curso);
          }else{
            cursoFrontend.divisiones.push(curso);
          }
          //Si ya estan las dos divisiones, se calcula el promedio del año
          if(cursoFrontend.divisiones.length==2){

            cursoFrontend.promedioAnio = parseFloat(
              (
                (cursoFrontend.divisiones[0].promedioGral + curso.promedioGral) /
                2
              ).toFixed(2)
            );
          }
        }
      }
    }    
  }
}
