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
import { Router } from "@angular/router";
import { MatSnackBar, MatDialog } from "@angular/material";
import Rolldate from "../../../assets/rolldate.min.js";
import { CancelPopupComponent } from "src/app/popup-genericos/cancel-popup.component";
import { Evento } from "../evento.model";
import { environment } from "src/environments/environment";
import { ResizeOptions, ImageResult } from "ng2-imageupload";
import { MediaMatcher } from "@angular/cdk/layout";

@Component({
  selector: "app-modificar-evento",
  templateUrl: "./modificar-evento.component.html",
  styleUrls: ["./modificar-evento.component.css"],
})
export class ModificarEventoComponent implements OnInit, OnDestroy {
  @ViewChild("chipsInput", { static: false }) chipsInput: ElementRef<
    HTMLInputElement
  >;
  @ViewChild("auto", { static: false }) matAutocomplete: MatAutocomplete;
  fechaActual: Date;
  imagesFile: any = [];
  imagenesCargadas: any[] = [];
  filenamesBorrados: any[] = [];
  message: string;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  chipsCtrl = new FormControl();
  filteredChips: Observable<string[]>;
  chips: string[] = [];
  allChips: string[] = ["1A", "2A", "3A", "4A", "5A", "6A", "Todos los cursos"];
  horaInicio: string;
  horaFin: string;
  evento: Evento;
  slideIndex = 1;
  private unsubscribe: Subject<void> = new Subject();
  _mobileQueryListener: () => void;
  mobileQuery: MediaQueryList;

  constructor(
    public eventoService: EventosService,
    public dialog: MatDialog,
    public router: Router,
    public snackBar: MatSnackBar,
    public changeDetectorRef: ChangeDetectorRef,
    public media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 800px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.filtrarChips();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  filtrarChips() {
    this.filteredChips = this.chipsCtrl.valueChanges.pipe(
      startWith(null),
      map((chip: string | null) =>
        chip ? this._filter(chip) : this.allChips.slice()
      )
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allChips.filter(
      (chip) => chip.toLowerCase().indexOf(filterValue) === 0
    );
  }

  ngOnInit() {
    this.evento = this.eventoService.evento;
    this.fechaActual = new Date();
    if (this.evento.filenames.length != 0) {
      for (let index = 0; index < this.evento.filenames.length; index++) {
        this.imagenesCargadas.push(
          environment.apiUrl + `/imagen/${this.evento.filenames[index]}`
        );
      }
      setTimeout(() => {
        this.showSlide(1);
      }, 500);
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

  inicializarPickers() {
    new Rolldate({
      el: "#pickerInicio",
      format: "hh:mm",
      minStep: 15,
      lang: {
        title: "Seleccione hora de inicio del evento",
        hour: "",
        min: "",
      },
      confirm: (date) => {
        this.evento.horaInicio = date;
      },
    });
    new Rolldate({
      el: "#pickerFin",
      format: "hh:mm",
      minStep: 15,
      lang: { title: "Seleccione hora de fin del evento", hour: "", min: "" },
      confirm: (date) => {
        this.evento.horaFin = date;
      },
    });
  }

  remove(chip: string): void {
    const index = this.chips.indexOf(chip);

    if (index >= 0) {
      this.chips.splice(index, 1);
    }
  }

  resizeOptions: ResizeOptions = {
    resizeMaxHeight: 600,
    resizeMaxWidth: 600,
  };

  async cargarImagen(imagenCargada: ImageResult) {
    this.imagesFile.push(imagenCargada.file);
    this.imagenesCargadas.push(
      (imagenCargada.resized && imagenCargada.resized.dataURL) ||
        imagenCargada.dataURL
    );
    this.showSlide(1);
  }

  moveFromCurrentSlide(n) {
    this.slideIndex += n;
    this.showSlide(this.slideIndex);
  }

  onEliminarImagen(index) {
    if (
      index > this.evento.filenames.length - 1 &&
      this.imagesFile.length > 0
    ) {
      this.imagesFile.splice(index - this.evento.filenames.length, 1);
    } else {
      this.filenamesBorrados.push(this.evento.filenames[index]);
    }
    this.imagenesCargadas.splice(index, 1);
    this.evento.filenames.splice(index, 1);
    this.moveFromCurrentSlide(1);
    this.snackBar.open("Se elimino imagen correctamente", "", {
      panelClass: ["snack-bar-exito"],
      duration: 1500,
    });
  }

  showSlide(n) {
    var slides = document.getElementsByClassName("mySlides");
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

  modificarEvento() {
    let fechaEvento = new Date(this.evento.fechaEvento);
    this.eventoService
      .modificarEvento(
        this.evento.titulo,
        this.evento.descripcion,
        fechaEvento,
        this.evento.horaInicio,
        this.evento.horaFin,
        this.evento.tags,
        this.imagesFile,
        this.evento.filenames,
        this.evento._id,
        this.evento.autor,
        this.filenamesBorrados
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rtdo) => {
        if (rtdo.exito) {
          this.snackBar.open(rtdo.message, "", {
            panelClass: ["snack-bar-exito"],
            duration: 4500,
          });
          this.router.navigate(["./home"]);
        } else {
          this.snackBar.open(rtdo.message, "", {
            duration: 4500,
            panelClass: ["snack-bar-fracaso"],
          });
        }
      });
  }

  onGuardarEvento(form: NgForm) {
    if (form.valid && this.evento.tags.length != 0) {
      if (this.evento.horaInicio != "" && this.evento.horaFin != "") {
        if (
          this.horaEventoEsValido(this.evento.horaInicio, this.evento.horaFin)
        ) {
          this.modificarEvento();
        } else {
          this.snackBar.open(
            "La hora de finalización del evento es menor que la hora de inicio",
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
    } else {
      this.snackBar.open("Faltan campos por completar", "", {
        duration: 4500,
        panelClass: ["snack-bar-fracaso"],
      });
    }
  }

  verHoraATomar(h1, h2): string {
    if (h1 == "") return h2;
    else return h1;
  }

  //Valida que la hora inicio sea menor que la hora fin.
  horaEventoEsValido(horaInicio: string, horaFin: string) {
    var variableDateInicio = new Date("01/01/2020 " + horaInicio);
    var variableDateFin = new Date("01/01/2020 " + horaFin);
    return variableDateInicio.getTime() < variableDateFin.getTime();
  }

  popUpCancelar() {
    this.dialog.open(CancelPopupComponent, {
      width: "250px",
    });
  }
}
