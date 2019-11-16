import { AuthInterceptor } from "./login/auth-interceptor";
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
  MatProgressSpinnerModule,
  MatCheckboxModule,
  MatSnackBarModule
} from "@angular/material";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatMenuModule } from "@angular/material/menu";
import { AppComponent } from "./app.component";
import {
  AltaEstudiantesComponent,
  AltaPopupComponent
} from "./estudiantes/alta-estudiantes/alta-estudiantes.component";
import { FormsModule } from "@angular/forms";
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
import { InscripcionEstudianteComponent, InscripcionPopupComponent } from './estudiantes/inscripcion-estudiantes/inscripcion-estudiantes.component';
import { RetiroAnticipadoComponent, RetiroPopupComponent } from './asistencia/retiro-anticipado/retiro-anticipado.component';
import { DocumentosInscripcionComponent, DocumentosInscripcionPopupComponent } from './estudiantes/documentos-inscripcion/documentos-inscripcion.component';
import {MatGridListModule} from '@angular/material/grid-list';
import { CalificacionesEstudiantesComponent, CalificacionesEstudiantePopupComponent } from './estudiantes/calificaciones-estudiantes/calificaciones-estudiantes.component';
import { LlegadaTardeComponent } from './asistencia/llegada-tarde/llegada-tarde.component';
import { CambiarPassword, CambiarPasswordPopupComponent } from './login/cambiar-password.component';
import { PerfilEstudianteComponent, PerfilEstudiantePopupComponent } from './estudiantes/perfil-estudiante/perfil-estudiante.component';
import { CalificacionesPerfilEstudianteComponent } from './estudiantes/perfil-estudiante/calificaciones-perfil-estudiante/calificaciones-perfil-estudiante.component';
import { AgendaCursoPerfilEstudianteComponent } from './estudiantes/perfil-estudiante/agenda-curso-perfil-estudiante/agenda-curso-perfil-estudiante.component';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { ChartsModule } from 'ng2-charts';
registerLocaleData(localePy, 'es');
import localePy from '@angular/common/locales/es';
import { JustificacionInasistenciaComponent} from './asistencia/justificacion-inasistencia/justificacion-inasistencia.component';
import { AltaARComponent, AltaARPopupComponent} from './adulto-responsable/alta-ar/alta-ar.component';
import { AltaEmpleadoComponent, AltaEmpleadoPopupComponent } from './empleado/alta-empleado/alta-empleado.component';
import { PreferenciasComponent, PreferenciasPopupComponent } from './menu-lateral/preferencias/preferencias.component';
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";
import { InasistenciasEstudianteComponent } from './estudiantes/perfil-estudiante/inasistencias-estudiante/inasistencias-estudiante.component';
import { TutoresEstudianteComponent } from './estudiantes/perfil-estudiante/tutores-estudiante/tutores-estudiante.component';
import { DatosEstudianteComponent } from './estudiantes/perfil-estudiante/datos-estudiante/datos-estudiante.component';

@NgModule({
  declarations: [
    AppComponent,
    AltaEstudiantesComponent,
    BuscarEstudiantesComponent,
    ListaEstudiantesComponent,
    MostrarEstudiantesComponent,
    AltaPopupComponent,
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
    DocumentosInscripcionPopupComponent,
    CalificacionesEstudiantesComponent,
    CalificacionesEstudiantePopupComponent,
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
    DatosEstudianteComponent
  ],
  //entryComponents declara los componentes que se generan dinamicamente dentro de otros.
  entryComponents: [
    AltaPopupComponent,
    MostrarPopupComponent,
    AsistenciaPopupComponent,
    PerfilEstudiantePopupComponent,
    BuscarPopupComponent,
    InscripcionPopupComponent,
    RetiroPopupComponent,
    DocumentosInscripcionPopupComponent,
    CalificacionesEstudiantePopupComponent,
    CambiarPasswordPopupComponent,
    CerrarSesionPopupComponent,
    PreferenciasPopupComponent,
    AltaEmpleadoPopupComponent,
    AltaARPopupComponent
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
