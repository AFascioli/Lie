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
import { Router } from "@angular/router";
import { MatSnackBar, MatDialog } from "@angular/material";
import Rolldate from "../../../assets/rolldate.min.js";
import { CancelPopupComponent } from "src/app/popup-genericos/cancel-popup.component";
import { Evento } from "../evento.model";

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
  imageFile: File;
  imgURL: any[] = [];
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
  evento: Evento;

  constructor(
    public eventoService: EventosService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar
  ) {
    //Hace que funcione el autocomplete, filtra

    this.filteredChips = this.chipsCtrl.valueChanges.pipe(
      startWith(null),
      map((chip: string | null) =>
        chip ? this._filter(chip) : this.allChips.slice()
      )
    );
  }

  ngOnInit() {
    this.evento = this.eventoService.evento;
    this.fechaActual = new Date();
    if (this.evento.filenames.length != 0) {
      for (let index = 0; index < this.evento.filenames.length; index++) {
        this.imgURL.push(
          `http://localhost:3000/imagen/${this.evento.filenames[index]}`
        );
      }
    }
    this.chips = this.evento.tags;
    this.inicializarPickers();
  }

  add(event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      if ((value || "").trim()) {
        if (this.allChips.includes(value)) this.chips.push(value.trim());
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

  remove(chip: string): void {
    const index = this.chips.indexOf(chip);

    if (index >= 0) {
      this.chips.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    if (event.option.viewValue == "Todos los cursos") {
      this.chips = [];
      this.chips.push(event.option.viewValue);
    } else if (
      !this.chips.includes(event.option.viewValue) &&
      !this.chips.includes("Todos los cursos")
    )
      this.chips.push(event.option.viewValue);
    if (this.chips.length == this.allChips.length - 1) {
      this.chips = [];
      this.chips.push("Todos los cursos");
    }
    this.chipsInput.nativeElement.value = "";
    this.chipsCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allChips.filter(
      chip => chip.toLowerCase().indexOf(filterValue) === 0
    );
  }

  obtenerImagen = (file, reader) => {
    return new Promise((resolve, reject) => {
      reader.readAsDataURL(file);
      reader.onload = _event => {
        resolve(reader.result);
      };
      if (file == null) {
        reject("No se pudo obtener la imagen.");
      }
    });
  };

  async preview(files) {
    let incorrectType = false;
    console.log(files);
    if (files.length === 0) return;

    for (let index = 0; index < files.length; index++) {
      var mimeType = files[index].type;
      if (mimeType.match(/image\/*/) == null) {
        incorrectType = true;
        files.splice(index, 1);
      }
    }

    incorrectType && (this.message = "Solo se admiten archivos de imagen");

    this.imageFile = files;
    this.imgURL = [];
    for (let index = 0; index < files.length; index++) {
      var reader = new FileReader();
      this.imgURL[index] = await this.obtenerImagen(files[index], reader);
    }
  }

  onGuardarEvento(form: NgForm) {
    console.log(this.evento);
    if (form.valid && this.evento.tags.length != 0) {
      //const fechaEvento = form.value.fechaEvento.toString();
      if (
        (this.evento.horaInicio == "" && this.evento.horaFin == "") ||
        this.horaEventoEsValido(this.evento.horaInicio, this.evento.horaFin)
      ) {
        let fechaEvento = new Date(this.evento.fechaEvento);
        this.eventoService
          .modificarEvento(
            this.evento.titulo,
            this.evento.descripcion,
            fechaEvento,
            this.evento.horaInicio,
            this.evento.horaFin,
            this.evento.tags,
            this.imageFile,
            this.evento.filenames,
            this.evento._id,
            this.evento.autor
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
      } else if (
        !this.horaEventoEsValido(this.evento.horaInicio, this.evento.horaFin)
      ) {
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

  onEliminarImg(imgUrl: string): void {
    this.eventoService.eliminarImagen(this.eventoService.ImgCargada);
  }
}
