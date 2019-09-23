import { AltaARComponent } from './adulto-responsable/alta-ar/alta-ar.component';
import { AltaEmpleadoComponent } from './empleado/alta-empleado/alta-empleado.component';
import { AgendaCursoPerfilEstudianteComponent } from './estudiantes/perfil-estudiante/agenda-curso-perfil-estudiante/agenda-curso-perfil-estudiante.component';
import { CalificacionesPerfilEstudianteComponent } from './estudiantes/perfil-estudiante/calificaciones-perfil-estudiante/calificaciones-perfil-estudiante.component';
import { PerfilEstudianteComponent } from './estudiantes/perfil-estudiante/perfil-estudiante.component';
import { HomeComponent } from "./home/home.component";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AltaEstudiantesComponent } from "./estudiantes/alta-estudiantes/alta-estudiantes.component";
import { BuscarEstudiantesComponent } from "./estudiantes/buscar-estudiantes/buscar-estudiantes.component";
import { ListaEstudiantesComponent } from "./estudiantes/lista-estudiantes/lista-estudiantes.component";
import { MostrarEstudiantesComponent } from "./estudiantes/mostrar-estudiantes/mostrar-estudiantes.component";
import { MenuLateralComponent } from "./menu-lateral/menu-lateral.component";
import { LoginComponent } from "./login/login.component";
import { RegistrarAsistenciaComponent } from "./asistencia/registrar-asistencia/registrar-asistencia.component";
import { InscripcionEstudianteComponent } from "./estudiantes/inscripcion-estudiantes/inscripcion-estudiantes.component";
import { RetiroAnticipadoComponent } from "./asistencia/retiro-anticipado/retiro-anticipado.component";
import { DocumentosInscripcionComponent } from "./estudiantes/documentos-inscripcion/documentos-inscripcion.component";
import { CalificacionesEstudiantesComponent } from "./estudiantes/calificaciones-estudiantes/calificaciones-estudiantes.component";
import { LlegadaTardeComponent } from "./asistencia/llegada-tarde/llegada-tarde.component";
import { AuthGuard } from "./login/auth.guard";
import { CambiarPassword } from "./login/cambiar-password.component";
import { RouteGuard } from "./route.guard";
import { JustificacionInasistenciaComponent } from './asistencia/justificacion-inasistencia/justificacion-inasistencia.component';

const routes: Routes = [
  { path: "login", component: LoginComponent },
  {
    path: "",
    component: MenuLateralComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "",
        pathMatch: "full",
        redirectTo: "home"
      },
      { path: "home", component: HomeComponent },
      { path: "alta", component: AltaEstudiantesComponent },
      {
        path: "buscar",
        component: BuscarEstudiantesComponent,
        children: [{ path: "lista", component: ListaEstudiantesComponent}]
      },
      {
        path: "mostrar",
        component: MostrarEstudiantesComponent, canActivate:[RouteGuard]
      },
      { path: "asistencia", component: RegistrarAsistenciaComponent },
      {
        path: "curso",
        component: InscripcionEstudianteComponent, canActivate:[RouteGuard]
      },
      {
        path: "retiroAnticipado",
        component: RetiroAnticipadoComponent, canActivate:[RouteGuard]
      },
      {
        path: "documentosEstudiante",
        component: DocumentosInscripcionComponent
      },
      {
        path: "calificacionesEstudiantes",
        component: CalificacionesEstudiantesComponent
      },
      { path: "llegadaTarde", component: LlegadaTardeComponent },
      { path: "cambiarContraseña", component: CambiarPassword },
      {
        path: "perfilEstudiante",
        component: PerfilEstudianteComponent, canActivate:[RouteGuard]
      },
      {
        path: "justificarInasistencia",
        component: JustificacionInasistenciaComponent//, canActivate:[RouteGuard]
      },
      {
        path: "calificacionesEstudiante",
        component: CalificacionesPerfilEstudianteComponent, canActivate:[RouteGuard]
      },
      {
        path: "altaEmpleado",
        component: AltaEmpleadoComponent
      },
      {
        path: "altaAdultoResponsable",
        component: AltaARComponent
      },





    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard, RouteGuard]
})
export class AppRoutingModule {}
