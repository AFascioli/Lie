import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { FormControl, NgForm } from "@angular/forms";
import {
  MatAutocompleteSelectedEvent,
  MatAutocomplete,
} from "@angular/material/autocomplete";
import { MatChipInputEvent } from "@angular/material/chips";
import { Observable, Subject } from "rxjs";
import { map, startWith, takeUntil } from "rxjs/operators";
import { EventosService } from "../eventos.service";
import { MatSnackBar, MatDialog } from "@angular/material";
import { CancelPopupComponent } from "src/app/popup-genericos/cancel-popup.component";
import { Router } from "@angular/router";
import { ImageResult, ResizeOptions } from "ng2-imageupload";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
  selector: "app-registrar-evento",
  templateUrl: "./registrar-evento.component.html",
  styleUrls: ["./registrar-evento.component.css"],
})
export class RegistrarEventoComponent implements OnInit, OnDestroy {
  @ViewChild("chipsInput", { static: false }) chipsInput: ElementRef<
    HTMLInputElement
  >;
  @ViewChild("auto", { static: false }) matAutocomplete: MatAutocomplete;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  chipsCtrl = new FormControl();
  filteredChips: Observable<string[]>;
  chips: string[] = [];
  allChips: string[] = [
    "1A",
    "1B",
    "2A",
    "2B",
    "3A",
    "3B",
    "4A",
    "4B",
    "5A",
    "5B",
    "6A",
    "6B",
    "Todos los cursos",
  ];
  horaInicioEvento: string;
  horaFinEvento: string;
  horaMinimaEvento: string;
  fechaSeleccionada: Date;
  slideIndex = 1;
  fechaActual: Date;
  imagesFile: any = [];
  imgURL: any[] = [];
  isLoading=false;

  private unsubscribe: Subject<void> = new Subject();
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(
    public eventoService: EventosService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public router: Router,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 800px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.filtrarChips();
  }

  ngOnInit() {
    this.fechaActual = new Date();
    this.horaMinimaEvento = `07:00`;
  }

  registrarEvento(fechaEvento, form) {
    this.isLoading=true;
    this.eventoService
      .registrarEvento(
        form.value.titulo,
        form.value.descripcion,
        fechaEvento,
        this.horaInicioEvento,
        this.horaFinEvento,
        this.chips,
        this.imagesFile
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rtdo) => {
        this.isLoading=false;
        if (rtdo.exito) {
          this.snackBar.open(rtdo.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
          this.router.navigate(["./home"]);
          form.resetForm();
        } else {
          this.snackBar.open(rtdo.message, "", {
            duration: 4500,
            panelClass: ["snack-bar-fracaso"],
          });
        }
      });
  }

  onGuardarEvento(form: NgForm) {
    if (form.valid && this.chips.length != 0) {
      const fechaEvento = form.value.fechaEvento.toString();
      if (
        (this.horaInicioEvento == "" && this.horaFinEvento == "") ||
        this.horaEventoEsValido(this.horaInicioEvento, this.horaFinEvento)
      ) {
        this.registrarEvento(fechaEvento, form);
      } else {
        this.snackBar.open(
          "La hora de finalización del evento no es mayor a la hora de inicio",
          "",
          {
            duration: 4500,
            panelClass: ["snack-bar-fracaso"],
          }
        );
      }
    } else {
      this.snackBar.open("Faltan campos por completar", "", {
        duration: 4500,
        panelClass: ["snack-bar-fracaso"],
      });
    }
  }

  horaEventoEsValido(horaInicio: string, horaFin: string) {
    var variableDateInicio = new Date("01/01/2020 " + horaInicio);
    var variableDateFin = new Date("01/01/2020 " + horaFin);
    return variableDateInicio < variableDateFin;
  }

  setearHoraMinima() {
    if (
      this.fechaSeleccionada.getDay() == this.fechaActual.getDay() &&
      this.fechaSeleccionada.getMonth() == this.fechaActual.getMonth()
    )
      this.horaMinimaEvento = `${this.fechaActual.getHours() + 2}:00`;
    else this.horaMinimaEvento = "07:00";
  }

  resetearHoras(){
    this.horaInicioEvento=""
    this.horaFinEvento=""
  }

  popUpCancelar() {
    this.dialog.open(CancelPopupComponent, {
      width: "250px",
    });
  }

  filtrarChips() {
    this.filteredChips = this.chipsCtrl.valueChanges.pipe(
      startWith(null),
      map((chip: string | null) =>
        chip ? this._filter(chip) : this.allChips.slice()
      )
    );
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

  remove(chip: string): void {
    const index = this.chips.indexOf(chip);

    if (index >= 0) {
      this.chips.splice(index, 1);
    }
  }

  //Agregado que cuando se selecciona una opcion, el input pierde focus para
  //que sea mas facil que el usuario pueda elegir otra
  selected(event: MatAutocompleteSelectedEvent, chipsInput: HTMLElement): void {
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
    chipsInput.blur();
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allChips.filter(
      (chip) => chip.toLowerCase().indexOf(filterValue) === 0
    );
  }

  resizeOptions: ResizeOptions = {
    resizeMaxHeight: 400,
    resizeMaxWidth: 400,
  };

  async cargarImagen(imagenCargada: ImageResult) {
    this.imagesFile.push(imagenCargada.file);
    this.imgURL.push(
      (imagenCargada.resized && imagenCargada.resized.dataURL) ||
        imagenCargada.dataURL
    );
    setTimeout(() => {
      this.showSlide(1);
    }, 500);
  }

  obtenerImagen(index) {
    return this.imgURL[index];
  }

  onEliminarImagen(index) {
    this.imgURL.splice(index, 1);
    this.imagesFile.splice(index, 1);
    this.moveFromCurrentSlide(1);
  }

  moveFromCurrentSlide(n) {
    this.slideIndex += n;
    this.showSlide(this.slideIndex);
  }

  showSlide(n) {
    var slides = document.getElementsByClassName("my-slides");
    var dots = document.getElementsByClassName("dot");
    this.esSlideValido(n, slides);
    for (let i = 0; i < slides.length; i++) {
      slides[i].setAttribute("style", "display:none;");
    }
    for (let i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
    }
    this.setAttributesCurrentSlide(slides, dots);
  }

  setAttributesCurrentSlide(slides, dots) {
    slides[this.slideIndex - 1].setAttribute("style", "display:block;");
    dots[this.slideIndex - 1].className += " active";
  }

  esSlideValido(n, slides) {
    if (n > slides.length) {
      this.slideIndex = 1;
    }
    if (n < 1) {
      this.slideIndex = slides.length;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
