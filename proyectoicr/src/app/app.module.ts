import { Evento } from "./eventos/evento.model";
import { AuthInterceptor } from "./login/auth-interceptor";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import {
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
  MatProgressSpinnerModule,
  MatCheckboxModule,
  MatSnackBarModule,
  MatChipsModule,
  MatInputModule
} from "@angular/material";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatMenuModule } from "@angular/material/menu";
import { AppComponent } from "./app.component";
import { AltaEstudiantesComponent } from "./estudiantes/alta-estudiantes/alta-estudiantes.component";
import { CancelPopupComponent } from "./popup-genericos/cancel-popup.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { EstudiantesService } from "./estudiantes/estudiante.service";
import {
  BuscarEstudiantesComponent,
  BuscarPopupComponent
} from "./estudiantes/buscar-estudiantes/buscar-estudiantes.component";
import { ListaEstudiantesComponent } from "./estudiantes/lista-estudiantes/lista-estudiantes.component";
import {
  MostrarEstudiantesComponent,
  MostrarPopupComponent
} from "./estudiantes/mostrar-estudiantes/mostrar-estudiantes.component";
import { AppRoutingModule } from "./app-routing.module";
import { LoginComponent } from "./login/login.component";
import {
  MenuLateralComponent,
  CerrarSesionPopupComponent
} from "./menu-lateral/menu-lateral.component";
import { HomeComponent } from "./home/home.component";
import {
  RegistrarAsistenciaComponent,
  AsistenciaPopupComponent
} from "./asistencia/registrar-asistencia/registrar-asistencia.component";
import { MatExpansionModule } from "@angular/material/expansion";
import {
  InscripcionEstudianteComponent,
  InscripcionPopupComponent
} from "./inscripcion/inscripcion-estudiantes/inscripcion-estudiantes.component";
import {
  RetiroAnticipadoComponent,
  RetiroPopupComponent
} from "./asistencia/retiro-anticipado/retiro-anticipado.component";
import { DocumentosInscripcionComponent } from "./inscripcion/documentos-inscripcion/documentos-inscripcion.component";
import { MatGridListModule } from "@angular/material/grid-list";
import { CalificacionesEstudiantesComponent } from "./calificaciones/calificaciones-estudiantes/calificaciones-estudiantes.component";
import { LlegadaTardeComponent } from "./asistencia/llegada-tarde/llegada-tarde.component";
import {
  CambiarPassword,
  CambiarPasswordPopupComponent
} from "./login/cambiar-password.component";
import {
  PerfilEstudianteComponent,
  PerfilEstudiantePopupComponent
} from "./perfil-estudiante/perfil-estudiante.component";
import { CalificacionesPerfilEstudianteComponent } from "./perfil-estudiante/calificaciones-perfil-estudiante/calificaciones-perfil-estudiante.component";
import { AgendaCursoPerfilEstudianteComponent } from "./perfil-estudiante/agenda-curso-perfil-estudiante/agenda-curso-perfil-estudiante.component";
import { LOCALE_ID } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { ChartsModule } from "ng2-charts";
registerLocaleData(localePy, "es");
import localePy from "@angular/common/locales/es";
import { JustificacionInasistenciaComponent } from "./asistencia/justificacion-inasistencia/justificacion-inasistencia.component";
import {
  AltaARComponent,
  AltaARPopupComponent
} from "./adulto-responsable/alta-ar/alta-ar.component";
import {
  AltaEmpleadoComponent,
  AltaEmpleadoPopupComponent
} from "./empleado/alta-empleado/alta-empleado.component";
import {
  PreferenciasComponent,
  PreferenciasPopupComponent
} from "./menu-lateral/preferencias/preferencias.component";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";
import { InasistenciasEstudianteComponent } from "./perfil-estudiante/inasistencias-estudiante/inasistencias-estudiante.component";
import { TutoresEstudianteComponent } from "./perfil-estudiante/tutores-estudiante/tutores-estudiante.component";
import { DatosEstudianteComponent } from "./perfil-estudiante/datos-estudiante/datos-estudiante.component";
import { CalificacionesExamenesComponent } from "./calificaciones/calificaciones-examenes/calificaciones-examenes.component";
import { RegistrarEventoComponent } from "./eventos/registrar-evento/registrar-evento.component";
import { VisualizarEventoComponent } from './eventos/visualizar-evento/visualizar-evento.component';
import { MatCarouselModule } from '@ngmodule/material-carousel';

@NgModule({
  declarations: [
    AppComponent,
    AltaEstudiantesComponent,
    BuscarEstudiantesComponent,
    ListaEstudiantesComponent,
    MostrarEstudiantesComponent,
    CancelPopupComponent,
    MostrarPopupComponent,
    PreferenciasPopupComponent,
    MenuLateralComponent,
    HomeComponent,
    RegistrarAsistenciaComponent,
    AsistenciaPopupComponent,
    PerfilEstudiantePopupComponent,
    BuscarPopupComponent,
    InscripcionEstudianteComponent,
    InscripcionPopupComponent,
    RetiroAnticipadoComponent,
    RetiroPopupComponent,
    DocumentosInscripcionComponent,
    CalificacionesEstudiantesComponent,
    LlegadaTardeComponent,
    CambiarPassword,
    CambiarPasswordPopupComponent,
    CerrarSesionPopupComponent,
    PerfilEstudianteComponent,
    CalificacionesPerfilEstudianteComponent,
    AgendaCursoPerfilEstudianteComponent,
    JustificacionInasistenciaComponent,
    AltaARComponent,
    AltaEmpleadoComponent,
    AltaEmpleadoPopupComponent,
    AltaARPopupComponent,
    PreferenciasComponent,
    LoginComponent,
    InasistenciasEstudianteComponent,
    TutoresEstudianteComponent,
    DatosEstudianteComponent,
    CalificacionesExamenesComponent,
    RegistrarEventoComponent,
    VisualizarEventoComponent
  ],
  //entryComponents declara los componentes que se generan dinamicamente dentro de otros.
  entryComponents: [
    CancelPopupComponent,
    MostrarPopupComponent,
    AsistenciaPopupComponent,
    PerfilEstudiantePopupComponent,
    BuscarPopupComponent,
    InscripcionPopupComponent,
    RetiroPopupComponent,
    CambiarPasswordPopupComponent,
    CerrarSesionPopupComponent,
    PreferenciasPopupComponent,
    AltaEmpleadoPopupComponent,
    AltaARPopupComponent
  ],
  imports: [
    MatChipsModule,
    BrowserModule,
    MatInputModule,
    ReactiveFormsModule,
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
    MatProgressSpinnerModule,
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
    MatGridListModule,
    ChartsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatCarouselModule.forRoot(),
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production,
      registrationStrategy: "registerImmediately"
    })
  ],
  //le decimos a angular que vamos a tener un interceptor nuevo (provide), luego le indicamos que
  //interceptor usar (useClass) y finalmente aclaramos que no sobreescriba el interceptor que esta
  //ya que podemos utilizar más de uno (multi).
  providers: [
    EstudiantesService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: "es" }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
