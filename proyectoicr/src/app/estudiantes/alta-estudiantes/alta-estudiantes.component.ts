import { Nacionalidad } from './../nacionalidades.model';
import { Component, OnInit, OnDestroy } from "@angular/core";
import { EstudiantesService } from "../estudiante.service";
import { NgForm } from "@angular/forms";
import { Provincia } from "../provincias.model";
import { Localidad } from "../localidades.model";
import { Subscription } from "rxjs";
import { DateAdapter } from "@angular/material";
import {
  MatDialog,
  MatDialogRef
} from "@angular/material/dialog";
import { Router } from '@angular/router';

@Component({
  selector: "app-alta-estudiantes",
  templateUrl: "./alta-estudiantes.component.html",
  styleUrls: ["./alta-estudiantes.component.css"]
})
export class AltaEstudiantesComponent implements OnInit, OnDestroy {
  maxDate = new Date();
  nacionalidades: Nacionalidad[] = [];
  provincias: Provincia[] = [];
  localidades: Localidad[] = [];
  localidadesFiltradas: Localidad[] = [];
  suscripcion: Subscription;


  constructor(
    public servicio: EstudiantesService,
    private dateAdapter: DateAdapter<Date>,
    public dialog: MatDialog
  ) {
    this.dateAdapter.setLocale("es");
  }

  // Cuando se inicializa el componente se cargar las provincias.
  ngOnInit() {
    this.servicio.formInvalidoEstudiante = true;
    this.servicio.getProvincias();
    this.suscripcion = this.servicio
      .getProvinciasListener()
      .subscribe(provinciasActualizadas => {
        this.provincias = provinciasActualizadas;
      });
    this.servicio.getLocalidades();
    this.suscripcion = this.servicio
      .getLocalidadesListener()
      .subscribe(localidadesActualizadas => {
        this.localidades = localidadesActualizadas;
      });
    this.servicio.getNacionalidades();
    this.suscripcion = this.servicio
      .getNacionalidadesListener()
      .subscribe(nacionalidadesActualizadas => {
        this.nacionalidades = nacionalidadesActualizadas;
      });
  }

  // Cuando se destruye el componente se eliminan las suscripciones.
  ngOnDestroy() {
    this.suscripcion.unsubscribe();
  }

  onGuardar(form: NgForm) {
    if (form.invalid) {
    } else {
      this.servicio.altaEstudiante(
        form.value.apellido,
        form.value.nombre,
        form.value.tipoDocumento,
        form.value.nroDocumento,
        form.value.cuil,
        form.value.sexo,
        form.value.calle,
        form.value.nroCalle,
        form.value.piso,
        form.value.departamento,
        form.value.provincia,
        form.value.localidad,
        form.value.codigoPostal,
        form.value.nacionalidad,
        form.value.fechaNac,
        form.value.estadoCivil,
        form.value.telefono,
        "AdultoTest"
      );
      form.resetForm();
    }
  }

  FiltrarLocalidades(idProvincia: number) {
    this.localidadesFiltradas = [...this.localidades];
    this.localidadesFiltradas = this.localidadesFiltradas.filter(
      localidad => localidad.id_provincia === idProvincia
    );
  }


  // Se valida el estado del formulario y se abre el pop up
  openDialogo(tipoPopup:string, form: NgForm): void {
    this.servicio.tipoPopUp = tipoPopup;
    if(form.invalid){
      this.servicio.formInvalidoEstudiante=true;
    }else{
      this.servicio.formInvalidoEstudiante=false;
    }
    this.dialog.open(AltaPopupComponent, {
      width: "250px"
    });
  }
}

@Component({
  selector: "app-alta-popup",
  templateUrl: "./alta-popup.component.html"
})
export class AltaPopupComponent {
  formInvalido : Boolean;
      tipoPopup :  string;
  constructor(
        public dialogRef: MatDialogRef<AltaPopupComponent>, public router: Router,  public servicio: EstudiantesService
      ) {this.tipoPopup = this.servicio.tipoPopUp;
        this.formInvalido = this.servicio.formInvalidoEstudiante;}

      onYesClick():void{
        this.router.navigate(['menuLateral/home']);
        this.dialogRef.close();
      }
      onNoClick(): void {
        this.dialogRef.close();
      }

       onOkClick(): void {
        this.servicio.formInvalidoEstudiante = true;
        this.dialogRef.close();
      }
}

