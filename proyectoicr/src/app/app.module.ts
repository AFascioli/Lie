import { AuthInterceptor } from './login/auth-interceptor';
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
  MatSlideToggleModule,
  MatCheckboxModule,
  MatSnackBarModule
} from "@angular/material";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatMenuModule } from "@angular/material/menu";
import { AppComponent } from "./app.component";
import {
  AltaEstudiantesComponent,
  AltaPopupComponent,
} from "./estudiantes/alta-estudiantes/alta-estudiantes.component";
import { FormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { EstudiantesService } from "./estudiantes/estudiante.service";
import { BuscarEstudiantesComponent, BuscarPopupComponent } from "./estudiantes/buscar-estudiantes/buscar-estudiantes.component";
import { ListaEstudiantesComponent} from "./estudiantes/lista-estudiantes/lista-estudiantes.component";
import {
  MostrarEstudiantesComponent,
  MostrarPopupComponent
} from "./estudiantes/mostrar-estudiantes/mostrar-estudiantes.component";
import { AppRoutingModule } from "./app-routing.module";
import { LoginComponent } from "./login/login.component";
import { MenuLateralComponent, CerrarSesionPopupComponent } from "./menu-lateral/menu-lateral.component";
import { HomeComponent } from "./home/home.component";
import {
  RegistrarAsistenciaComponent,
  AsistenciaPopupComponent
} from "./asistencia/registrar-asistencia/registrar-asistencia.component";
import { MatExpansionModule } from "@angular/material/expansion";
import { InscripcionEstudianteComponent, InscripcionPopupComponent } from './estudiantes/inscripcion-estudiantes/inscripcion-estudiantes.component';
import { RetiroAnticipadoComponent, RetiroPopupComponent } from './asistencia/retiro-anticipado/retiro-anticipado.component';
import { DocumentosInscripcionComponent, DocumentosInscripcionPopupComponent } from './estudiantes/documentos-inscripcion/documentos-inscripcion.component';
import {MatGridListModule} from '@angular/material/grid-list';
import { CalificacionesEstudiantesComponent, CalificacionesEstudiantePopupComponent } from './estudiantes/calificaciones-estudiantes/calificaciones-estudiantes.component';
import { LlegadaTardeComponent } from './asistencia/llegada-tarde/llegada-tarde.component';
import { CambiarPassword, CambiarPasswordPopupComponent } from './login/cambiar-password.component';

@NgModule({
  declarations: [
    AppComponent,
    AltaEstudiantesComponent,
    BuscarEstudiantesComponent,
    ListaEstudiantesComponent,
    MostrarEstudiantesComponent,
    AltaPopupComponent,
    MostrarPopupComponent,
    LoginComponent,
    MenuLateralComponent,
    HomeComponent,
    RegistrarAsistenciaComponent,
    AsistenciaPopupComponent,
    BuscarPopupComponent,
    InscripcionEstudianteComponent,
    InscripcionPopupComponent,
    RetiroAnticipadoComponent,
    RetiroPopupComponent,
    DocumentosInscripcionComponent,
    DocumentosInscripcionPopupComponent,
    CalificacionesEstudiantesComponent,
    CalificacionesEstudiantePopupComponent,
    LlegadaTardeComponent,
    CambiarPassword,
    CambiarPasswordPopupComponent,
    CerrarSesionPopupComponent
  ],
  //entryComponents declara los componentes que se generan dinamicamente dentro de otros.
  entryComponents: [
    AltaPopupComponent,
    MostrarPopupComponent,
    AsistenciaPopupComponent,
    BuscarPopupComponent,
    InscripcionPopupComponent,
    RetiroPopupComponent,
    DocumentosInscripcionPopupComponent,
    CalificacionesEstudiantePopupComponent,
    CambiarPasswordPopupComponent,
    CerrarSesionPopupComponent
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
    MatSlideToggleModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatGridListModule
  ],
  //le decimos a angular que vamos a tener un interceptor nuevo (provide), luego le indicamos que
  //interceptor usar (useClass) y finalmente aclaramos que no sobreescriba el interceptor que esta
  //ya que podemos utilizar más de uno (multi).
  providers: [EstudiantesService, {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}],
  bootstrap: [AppComponent]
})

export class AppModule {}
