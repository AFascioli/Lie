import { CicloLectivoService } from "src/app/cicloLectivo.service";
import { Component, OnInit, ViewChild } from "@angular/core";
import { MatAccordion } from "@angular/material/expansion";
import { EstudiantesService } from "src/app/estudiantes/estudiante.service";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs/internal/Subject";

@Component({
  selector: "app-estado-cursos",
  templateUrl: "./estado-cursos.component.html",
  styleUrls: ["./estado-cursos.component.css"],
})
export class EstadoCursosComponent implements OnInit {
  @ViewChild(MatAccordion, { static: true }) accordion: MatAccordion;

  cursosEstados: any[] = [];
  displayedColumns: string[] = ["materia", "estado"];
  cursos: any[] = [];
  isLoading = true;
  private unsubscribe: Subject<void> = new Subject();

  constructor(public servicioCicloLectivo: CicloLectivoService) {}

  ngOnInit(): void {
    this.servicioCicloLectivo
      .obtenerEstadoMateriasCursos()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((response) => {
        this.cursosEstados = response.cursosEstados;
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
