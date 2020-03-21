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

@Component({
  selector: "app-modificar-evento",
  templateUrl: "./modificar-evento.component.html",
  styleUrls: ["./modificar-evento.component.css"]
})
export class ModificarEventoComponent implements OnInit {
  @ViewChild("tagsInput", { static: false }) tagsInput: ElementRef<
    HTMLInputElement
  >;
  @ViewChild("auto", { static: false }) matAutocomplete: MatAutocomplete;
  fechaActual: Date;
  imageFile: File = null;
  imgURL: any;
  message: string;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  tagsCtrl = new FormControl();
  filteredTags: Observable<string[]>;
  tags: string[] = [];
  allTags: string[] = ["1A", "2A", "3A", "4A", "5A", "6A", "Todos los cursos"];
  horaInicio = "";
  horaFin = "";
  evento;

  constructor(
    public eventoService: EventosService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public router: Router
  ) {
    //Hace que funcione el autocomplete, filtra
    this.filteredTags = this.tagsCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) =>
        tag ? this._filter(tag) : this.allTags.slice()
      )
    );
  }

  ngOnInit() {
    this.fechaActual = new Date();
    this.evento = this.eventoService.evento;
    // if (this.evento == null) {
    //   this.router.navigate(["./home"]);
    // }
    this.imgURL = `http://localhost:3000/imagen/${this.evento.filename}`;
    this.tags = this.evento.tags;
    this.inicializarPickers();
  }

  add(event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      if ((value || "").trim()) {
        if (this.allTags.includes(value)) this.tags.push(value.trim());
      }

      if (input) {
        input.value = "";
      }

      this.tagsCtrl.setValue(null);
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
    const index = this.tags.indexOf(fruit);

    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    if (event.option.viewValue == "Todos los cursos") {
      this.tags = [];
      this.tags.push(event.option.viewValue);
    } else if (
      !this.tags.includes(event.option.viewValue) &&
      !this.evento.tags.includes(event.option.viewValue) &&
      !this.tags.includes("Todos los cursos")
    )
      this.tags.push(event.option.viewValue);
    if (this.tags.length == this.allTags.length - 1) {
      this.tags = [];
      this.tags.push("Todos los cursos");
    }
    this.tagsInput.nativeElement.value = "";
    this.tagsCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allTags.filter(
      tag => tag.toLowerCase().indexOf(filterValue) === 0
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
    this.imageFile = files;
    reader.readAsDataURL(files[0]);
    reader.onload = _event => {
      this.imgURL = reader.result;
    };
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
            this.evento.filename,
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
}
