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
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: "app-registrar-evento",
  templateUrl: "./registrar-evento.component.html",
  styleUrls: ["./registrar-evento.component.css"]
})
export class RegistrarEventoComponent implements OnInit {
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
  chips: string[] = ["Todos los cursos"];
  allChips: string[] = ["1A", "2A", "3A", "4A", "5A", "6A", "Todos los cursos"];

  constructor(public eventoService: EventosService, public snackBar: MatSnackBar) {
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
    console.log(form.value.titulo);
    this.eventoService.registrarEvento(
      form.value.titulo,
      form.value.descripcion,
      form.value.fechaEvento,
      form.value.horaInicio,
      form.value.horaFin,
      this.chips,
      this.imagePath
    ).subscribe(rtdo=> {
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
      console.log(rtdo);
    });
  }
}
