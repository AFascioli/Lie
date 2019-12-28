import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { FormControl } from "@angular/forms";
import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete
} from "@angular/material/autocomplete";
import { MatChipInputEvent } from "@angular/material/chips";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";

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
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  chipsCtrl = new FormControl();
  filteredChips: Observable<string[]>;
  chips: string[] = ["Todos los cursos"];
  allChips: string[] = ["1A", "2A", "3A", "4A", "5A", "6A", "Todos los cursos"];

  constructor() {
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
      fruit => fruit.toLowerCase().indexOf(filterValue) === 0
    );
  }
}
