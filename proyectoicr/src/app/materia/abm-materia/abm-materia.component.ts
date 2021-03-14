import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MatSnackBar,
  MatTableDataSource,
} from "@angular/material";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AgendaService } from "src/app/agenda/agenda.service";

@Component({
  selector: "app-abm-materia",
  templateUrl: "./abm-materia.component.html",
  styleUrls: ["./abm-materia.component.css"],
})
export class AbmMateriaComponent implements OnInit {
  isLoading = false;
  materias = new MatTableDataSource<any>();
  materiasArray = [];
  displayedColumns: string[] = ["Materia", "Accion"];
  matConfig = new MatDialogConfig();
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    public agendaService: AgendaService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.agendaService.obtenerMaterias().subscribe((response) => {
      for (const materia of response.materias) {
        let objetoMateria = {
          _id: materia._id,
          nombre: materia.nombre,
          borrar: false,
        };
        this.materiasArray.push(objetoMateria);
      }
      this.materias.data = [...this.materiasArray];
      this.isLoading = false;
    });
  }

  onAgregarMateria() {
    this.matConfig.width = "500px";
    this.matConfig.height = "240px";
    const popup = this.dialog.open(AbmMateriaPopupComponent, this.matConfig);
    popup
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((resultado) => {
        if (resultado.resultado) {
          if (
            !this.materias.data.find(
              (materia) =>
                materia.nombre.toUpperCase() ==
                resultado.nombreMateria.toUpperCase()
            )
          ) {
            let objetoMateria = {
              _id: null,
              nombre: resultado.nombreMateria,
              borrar: false,
            };
            this.materiasArray.push(objetoMateria);
            this.materias.data.push(objetoMateria);
            this.materias._updateChangeSubscription();
          } else {
            this.snackBar.open("La materia ya existe", "", {
              panelClass: ["snack-bar-fracaso"],
              duration: 3000,
            });
          }
        }
      });
  }

  onBorrar(nombreMateria: string, index: number) {
    this.materias.data.splice(index, 1);
    this.materiasArray.map((materia) => {
      if (materia.nombre.toUpperCase() == nombreMateria.toUpperCase()) {
        materia.borrar = true;
      }
    });
    this.materias._updateChangeSubscription();
  }

  onGuardar() {
    this.isLoading = true;
    this.agendaService.abmMateria(this.materiasArray).subscribe((response) => {
      if (response.exito) {
        this.materias.data = [];
        this.materiasArray = [];
        this.agendaService.obtenerMaterias().subscribe((response) => {
          for (const materia of response.materias) {
            let objetoMateria = {
              _id: materia._id,
              nombre: materia.nombre,
              borrar: false,
            };
            this.materiasArray.push(objetoMateria);
          }
          this.materias.data = [...this.materiasArray];
          this.materias._updateChangeSubscription();
          this.isLoading = false;
        });
        if (response.materiasNoBorradas != "") {
          this.snackBar.open(
            "Las siguientes materias no pudieron ser borradas ya que tienen una agenda de curso asignada " +
              response.materiasNoBorradas,
            "",
            {
              panelClass: ["snack-bar-fracaso"],
              duration: 4000,
            }
          );
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4000,
          });
        } else {
          this.snackBar.open(response.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4000,
          });
        }
      } else {
        this.isLoading = false;
        this.snackBar.open(response.message, "", {
          panelClass: ["snack-bar-fracaso"],
          duration: 4000,
        });
      }
    });
  }
}

@Component({
  selector: "app-abm-materia-popup",
  templateUrl: "./abm-materia-popup.component.html",
  styleUrls: ["./abm-materia.component.css"],
})
export class AbmMateriaPopupComponent implements OnDestroy {
  private unsubscribe: Subject<void> = new Subject();

  constructor(public dialogRef: MatDialogRef<AbmMateriaPopupComponent>) {}

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  onCancelarClick(): void {
    this.dialogRef.close({ resultado: false, nombreMateria: "" });
  }

  onGuardar(nombreMateria: String): void {
    if (nombreMateria != "") {
      this.dialogRef.close({ resultado: true, nombreMateria: nombreMateria });
    }
  }

  checkLetrasNumeros(event) {
    var inputValue = event.which;
    if (
      !(
        (inputValue >= 65 && inputValue <= 122) ||
        inputValue == 209 ||
        inputValue == 241
      ) &&
      inputValue != 32 &&
      inputValue != 0 &&
      !(inputValue >= 48 && inputValue <= 57) &&
      inputValue != 32 &&
      inputValue != 0
    ) {
      event.preventDefault();
    }
  }
}
