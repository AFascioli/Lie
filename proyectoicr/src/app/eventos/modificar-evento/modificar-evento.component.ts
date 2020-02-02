import { Comentario } from "./../comentario.model";
import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { FormControl, NgForm } from "@angular/forms";
import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete
} from "@angular/material/autocomplete";
import { MatChipInputEvent } from "@angular/material/chips";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { EventosService } from "../eventos.service";
import { MatSnackBar, MatDialog } from "@angular/material";
import Rolldate from "../../../assets/rolldate.min.js";
import { CancelPopupComponent } from "src/app/popup-genericos/cancel-popup.component";

//Parche para la demo #resolve
declare var require: any;

@Component({
  selector: "app-modificar-evento",
  templateUrl: "./modificar-evento.component.html",
  styleUrls: ["./modificar-evento.component.css"]
})
export class ModificarEventoComponent implements OnInit {
  @ViewChild("chipsInput", { static: false }) chipsInput: ElementRef<
    HTMLInputElement
  >;
  @ViewChild("auto", { static: false }) matAutocomplete: MatAutocomplete;
  fechaActual: Date;
  imagePath: File;
  imgURL: any;
  message: string;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  chipsCtrl = new FormControl();
  filteredChips: Observable<string[]>;
  chips: string[] = [];
  allChips: string[] = ["1A", "2A", "3A", "4A", "5A", "6A", "Todos los cursos"];
  horaInicio = "";
  horaFin = "";
  //HTML

  tituloEvento: string;
  descripcionDelEvento: string;
  fechaDelEvento: Date;
  horaInicial: string;
  horaFinal: string;
  cursos: string[];
  imagenEvento: string;

  constructor(
    public eventoService: EventosService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar
  ) {
    this.tituloEvento = this.eventoService.evento.titulo;
    this.descripcionDelEvento = this.eventoService.evento.descripcion;
    this.fechaDelEvento = this.eventoService.evento.fechaEvento;
    this.horaInicial = this.eventoService.evento.horaInicio;
    this.horaFinal = this.eventoService.evento.horaFin;
    this.cursos = this.eventoService.evento.tags;
    this.chips = this.eventoService.evento.tags;
    this.imagenEvento = this.eventoService.evento.imgUrl;
    this.imgURL = this.getImage(this.imagenEvento);
    //Hace que funcione el autocomplete, filtra

    this.filteredChips = this.chipsCtrl.valueChanges.pipe(
      startWith(null),
      map((chip: string | null) =>
        chip ? this._filter(chip) : this.allChips.slice()
      )
    );
  }

  ngOnInit() {
    this.fechaActual = new Date();
    this.inicializarPickers();
  }

  add(event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      if ((value || "").trim()) {
        this.chips.push(value.trim());
      }

      if (input) {
        input.value = "";
      }

      this.chipsCtrl.setValue(null);
    }
  }

  inicializarPickers() {
    new Rolldate({
      el: "#pickerInicio",
      format: "hh:mm",
      minStep: 15,
      lang: {
        title: "Seleccione hora de inicio del evento",
        hour: "",
        min: ""
      },
      confirm: date => {
        this.horaInicio = date;
      }
    });
    new Rolldate({
      el: "#pickerFin",
      format: "hh:mm",
      minStep: 15,
      lang: { title: "Seleccione hora de fin del evento", hour: "", min: "" },
      confirm: date => {
        this.horaFin = date;
      }
    });
  }
  remove(fruit: string): void {
    const index = this.chips.indexOf(fruit);

    if (index >= 0) {
      this.chips.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.chips.push(event.option.viewValue);
    this.chipsInput.nativeElement.value = "";
    this.chipsCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allChips.filter(
      chip => chip.toLowerCase().indexOf(filterValue) === 0
    );
  }

  preview(files) {
    if (files.length === 0) return;

    var mimeType = files[0].type;
    if (mimeType.match(/image\/*/) == null) {
      this.message = "Solo se admiten archivos de imagen";
      return;
    }

    var reader = new FileReader();
    this.imagePath = files;
    reader.readAsDataURL(files[0]);
    reader.onload = _event => {
      this.imgURL = reader.result;
    };
  }

  onGuardarEvento(form: NgForm) {
    if (form.valid && this.chips.length != 0) {
      const fechaEvento = form.value.fechaEvento.toString();
      if (this.horaInicio == "" && this.horaFin == "") {
        this.eventoService
          .ModificarEvento(
            this.eventoService.evento._id,
            form.value.titulo,
            form.value.descripcion,
            fechaEvento,
            this.horaInicial,
            this.horaFinal,
            this.chips,
            this.eventoService.evento.autor,
            this.imagePath,
            this.eventoService.evento.comentarios
          )
          .subscribe(rtdo => {
            if (rtdo.exito) {
              this.snackBar.open(rtdo.message, "", {
                panelClass: ["snack-bar-exito"],
                duration: 4500
              });
            } else {
              this.snackBar.open(rtdo.message, "", {
                duration: 4500,
                panelClass: ["snack-bar-fracaso"]
              });
            }
          });
      } else if (this.horaEventoEsValido(this.horaInicio, this.horaFin)) {
        this.eventoService
          .ModificarEvento(
            this.eventoService.evento._id,
            form.value.titulo,
            form.value.descripcion,
            fechaEvento,
            this.horaInicio,
            this.horaFin,
            this.chips,
            this.eventoService.evento.autor,
            this.imagePath,
            this.eventoService.evento.comentarios
          )
          .subscribe(rtdo => {
            if (rtdo.exito) {
              this.snackBar.open(rtdo.message, "", {
                panelClass: ["snack-bar-exito"],
                duration: 4500
              });
            } else {
              this.snackBar.open(rtdo.message, "", {
                duration: 4500,
                panelClass: ["snack-bar-fracaso"]
              });
            }
          });
      } else {
        this.snackBar.open(
          "La hora de finalización del evento es menor que la hora de inicio",
          "",
          {
            duration: 4500,
            panelClass: ["snack-bar-fracaso"]
          }
        );
      }
    } else {
      this.snackBar.open("Faltan campos por completar", "", {
        duration: 4500,
        panelClass: ["snack-bar-fracaso"]
      });
    }
  }

  //Valida que la hora inicio sea menor que la hora fin.
  horaEventoEsValido(horaInicio: string, horaFin: string) {
    var variableDateInicio = new Date("01/01/2020 " + horaInicio);
    var variableDateFin = new Date("01/01/2020 " + horaFin);
    return variableDateInicio < variableDateFin;
  }

  popUpCancelar() {
    this.dialog.open(CancelPopupComponent, {
      width: "250px"
    });
  }
  getImage(imgUrl) {
    return require("backend/images/" + imgUrl);
  }
}
