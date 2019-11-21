import { PreferenciasComponent } from './menu-lateral/preferencias/preferencias.component';

import { AltaARComponent } from './adulto-responsable/alta-ar/alta-ar.component';
import { AltaEmpleadoComponent } from './empleado/alta-empleado/alta-empleado.component';
import { AgendaCursoPerfilEstudianteComponent } from "./estudiantes/perfil-estudiante/agenda-curso-perfil-estudiante/agenda-curso-perfil-estudiante.component";
import { CalificacionesPerfilEstudianteComponent } from "./estudiantes/perfil-estudiante/calificaciones-perfil-estudiante/calificaciones-perfil-estudiante.component";
import { PerfilEstudianteComponent } from "./estudiantes/perfil-estudiante/perfil-estudiante.component";
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
import { JustificacionInasistenciaComponent } from "./asistencia/justificacion-inasistencia/justificacion-inasistencia.component";
import { RoleGuard } from './role.guard';
import { InasistenciasEstudianteComponent } from './estudiantes/perfil-estudiante/inasistencias-estudiante/inasistencias-estudiante.component';
import { DatosEstudianteComponent } from './estudiantes/perfil-estudiante/datos-estudiante/datos-estudiante.component';
import { TutoresEstudianteComponent } from './estudiantes/perfil-estudiante/tutores-estudiante/tutores-estudiante.component';

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
      {
        path: "alta",
        component: AltaEstudiantesComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] }
      },
      {
        path: "buscar",
        component: BuscarEstudiantesComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] },
        children: [{ path: "lista",
        component: ListaEstudiantesComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] } }]
      },
      {
        path: "mostrar",
        component: MostrarEstudiantesComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] }
      },
      {
        path: "asistencia",
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] },
        component: RegistrarAsistenciaComponent
      },
      {
        path: "curso", //ruta inscribir estudiante a un curso
        component: InscripcionEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] }
      },
      {
        path: "retiroAnticipado",
        component: RetiroAnticipadoComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] }
      },
      {
        path: "documentosEstudiante",
        component: DocumentosInscripcionComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] }
      },
      {
        path: "calificacionesEstudiantes",
        component: CalificacionesEstudiantesComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] }
      },
      {
        path: "llegadaTarde",
        component: LlegadaTardeComponent,
        canActivate: [RoleGuard, RouteGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] }
      },
      { path: "cambiarContraseña",
      component: CambiarPassword },
      {
        path: "perfilEstudiante",
        component: PerfilEstudianteComponent,
        canActivate: [RouteGuard,RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente","AdultoResponsable"] },
        children: [{
        path: "calificacionesEstudiante",
        component: CalificacionesPerfilEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente","AdultoResponsable"] }},
         {
        path: "inasistenciasEstudiante",
        component: InasistenciasEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente","AdultoResponsable"] }
      },  {
        path: "tutoresEstudiante",
        component: TutoresEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente","AdultoResponsable"] }
      },
      {
        path: "datosEstudiante",
        component: DatosEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente","AdultoResponsable"] }
      }
      ]
      },
      {
        path: "justificarInasistencia",
        component: JustificacionInasistenciaComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] }
      },

      {
        path: "altaEmpleado",
        component: AltaEmpleadoComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Director"] }
      },
      {
        path: "altaAdultoResponsable",
        component: AltaARComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Director", "Preceptor"] }
      },
      {
        path:"preferencias",
        component: PreferenciasComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard, RouteGuard, RoleGuard]
})
export class AppRoutingModule {}
