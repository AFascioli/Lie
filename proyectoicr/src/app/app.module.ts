import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import {
  MatInputModule,
  MatSelectModule,
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatNativeDateModule,
  MatAutocompleteModule,
  MatRadioModule,
  MatTableModule,
  MatSidenavModule,
  MatToolbarModule,
  MatIconModule,
  MatListModule,
  MatSlideToggleModule
} from "@angular/material";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatMenuModule } from "@angular/material/menu";
import { AppComponent } from "./app.component";
import {
  AltaEstudiantesComponent,
  DialogoPopupComponent,
  DialogoDosPopupComponent
} from "./estudiantes/alta-estudiantes/alta-estudiantes.component";
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { EstudiantesService } from "./estudiantes/estudiante.service";
import { BuscarEstudiantesComponent } from "./estudiantes/buscar-estudiantes/buscar-estudiantes.component";
import { ListaEstudiantesComponent } from "./estudiantes/lista-estudiantes/lista-estudiantes.component";
import {
  MostrarEstudiantesComponent,
  MostrarPopupComponent
} from "./estudiantes/mostrar-estudiantes/mostrar-estudiantes.component";
import { AppRoutingModule } from "./app-routing.module";
import { MenuPrincipalComponent } from "./menu-principal/menu-principal.component";
import { MenuLateralComponent } from "./menu-lateral/menu-lateral.component";
import { HomeComponent } from "./home/home.component";
import {
  RegistrarAsistenciaComponent,
  AsistenciaPopupComponent
} from "./asistencia/registrar-asistencia/registrar-asistencia.component";

@NgModule({
  declarations: [
    AppComponent,
    AltaEstudiantesComponent,
    BuscarEstudiantesComponent,
    ListaEstudiantesComponent,
    MostrarEstudiantesComponent,
    DialogoPopupComponent,
    DialogoDosPopupComponent,
    MostrarPopupComponent,
    MenuPrincipalComponent,
    MenuLateralComponent,
    HomeComponent,
    RegistrarAsistenciaComponent,
    AsistenciaPopupComponent
  ],
  //entryComponents declara los componentes que se generan dinamicamente dentro de otros.
  entryComponents: [
    DialogoPopupComponent,
    DialogoDosPopupComponent,
    MostrarPopupComponent,
    AsistenciaPopupComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatTableModule,
    HttpClientModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatRadioModule,
    MatSidenavModule,
    AppRoutingModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatSlideToggleModule
  ],
  providers: [EstudiantesService],
  bootstrap: [AppComponent]
})
export class AppModule {}
