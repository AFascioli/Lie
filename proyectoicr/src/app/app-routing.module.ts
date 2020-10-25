import { RendimientoCursoComponent } from './reportes/rendimiento-curso/rendimiento-curso.component';
import { CuotasAdeudadasComponent } from "./reportes/cuotas-adeudadas/cuotas-adeudadas.component";
import { DocAdeudadosComponent } from "./reportes/doc-adeudados/doc-adeudados.component";
import { BuscarAdultoResponsableComponent } from "./adulto-responsable/buscar-adulto-responsable/buscar-adulto-responsable.component";
import { AsociarAdultoResponsableComponent } from "./adulto-responsable/asociar-adulto-responsable/asociar-adulto-responsable.component";
import { InscripcionCursoComponent } from "./inscripcion/inscripcion-curso/inscripcion-curso.component";
import { MenuPrincipalAdultoResponsableComponent } from "./menu-principal-adulto-responsable/menu-principal-adulto-responsable.component";
import { RegistrarSancionesComponent } from "./sanciones/registrar-sanciones/registrar-sanciones.component";
import { RegistrarCuotasComponent } from "./cuotas/registrar-cuotas/registrar-cuotas.component";
import { RegistrarEventoComponent } from "./eventos/registrar-evento/registrar-evento.component";
import { CalificacionesExamenesComponent } from "./calificaciones/calificaciones-examenes/calificaciones-examenes.component";
import { PreferenciasComponent } from "./menu-lateral/preferencias/preferencias.component";
import { AltaAdultoResponsableComponent } from "./adulto-responsable/alta-adulto-responsable/alta-adulto-responsable.component";
import { AltaEmpleadoComponent } from "./empleado/alta-empleado/alta-empleado.component";
import { AgendaCursoPerfilEstudianteComponent } from "./perfil-estudiante/agenda-curso-perfil-estudiante/agenda-curso-perfil-estudiante.component";
import { CalificacionesPerfilEstudianteComponent } from "./perfil-estudiante/calificaciones-perfil-estudiante/calificaciones-perfil-estudiante.component";
import { PerfilEstudianteComponent } from "./perfil-estudiante/perfil-estudiante.component";
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
import { InscripcionEstudianteComponent } from "./inscripcion/inscripcion-estudiantes/inscripcion-estudiantes.component";
import { RetiroAnticipadoComponent } from "./asistencia/retiro-anticipado/retiro-anticipado.component";
import { DocumentosInscripcionComponent } from "./inscripcion/documentos-inscripcion/documentos-inscripcion.component";
import { CalificacionesEstudiantesComponent } from "./calificaciones/calificaciones-estudiantes/calificaciones-estudiantes.component";
import { LlegadaTardeComponent } from "./asistencia/llegada-tarde/llegada-tarde.component";
import { AuthGuard } from "./login/auth.guard";
import { CambiarPassword } from "./login/cambiar-password.component";
import { RouteGuard } from "./route.guard";
import { JustificacionInasistenciaComponent } from "./asistencia/justificacion-inasistencia/justificacion-inasistencia.component";
import { RoleGuard } from "./role.guard";
import { InasistenciasEstudianteComponent } from "./perfil-estudiante/inasistencias-estudiante/inasistencias-estudiante.component";
import { DatosEstudianteComponent } from "./perfil-estudiante/datos-estudiante/datos-estudiante.component";
import { CuotasPerfilEstudianteComponent } from "./perfil-estudiante/cuotas-perfil-estudiante/cuotas-perfil-estudiante.component";
import { TutoresEstudianteComponent } from "./perfil-estudiante/tutores-estudiante/tutores-estudiante.component";
import { ModificarEventoComponent } from "./eventos/modificar-evento/modificar-evento.component";
import { VisualizarEventoComponent } from "./eventos/visualizar-evento/visualizar-evento.component";
import { VisualizarAgendaComponent } from "./agenda/visualizar-agenda/visualizar-agenda.component";
import { SancionesEstudianteComponent } from "./perfil-estudiante/sanciones-estudiante/sanciones-estudiante.component";
import { RouteEventoGuard } from "./routeEvento.guard";
import { DefinirAgendaComponent } from "./agenda/definir-agenda/definir-agenda.component";
import { CalificacionesCicloLectivoComponent } from "./calificaciones/calificaciones-ciclo-lectivo/calificaciones-ciclo-lectivo.component";
import { SolicitudReunionComponent } from "./solicitud-reunion/solicitud-reunion.component";
import { SolicitudReunionAdultoResponsableComponent } from "./solicitud-reunion-adulto-responsable/solicitud-reunion-adulto-responsable.component";
import { ModificarAdultoResponsableComponent } from "./adulto-responsable/modificar-adulto-responsable/modificar-adulto-responsable.component";
import { AccionesDirectorComponent } from "./acciones-director/acciones-director.component";
import { ParametrizarReglasNegocioComponent } from "./acciones-director/parametrizar-reglas-negocio/parametrizar-reglas-negocio.component";
import { EstadoCursosComponent } from "./acciones-director/estado-cursos/estado-cursos.component";
import { CicloLectivoComponent } from "./acciones-director/ciclo-lectivo/ciclo-lectivo/ciclo-lectivo.component";
import { ReportesComponent } from "./reportes/reportes.component";
import { ResumenAcademicoComponent, ReporteResumenAcademicoComponent } from './reportes/resumen-academico/resumen-academico.component';

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
        redirectTo: "home",
        data: {
          rolesValidos: ["Admin", "Preceptor", "Director", "Docente"],
        },
      },
      {
        path: "modificarAdultoResponsable",
        component: ModificarAdultoResponsableComponent,
        data: {
          rolesValidos: ["Admin", "Preceptor", "Director"],
        },
      },
      {
        path: "definirAgenda",
        component: DefinirAgendaComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Director", "Preceptor"] },
      },
      {
        path: "home",
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] },
        component: HomeComponent,
      },
      {
        path: "menuPrincipal",
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "AdultoResponsable"] },
        component: MenuPrincipalAdultoResponsableComponent,
      },
      {
        path: "solicitudReunionAR",
        canActivate: [RoleGuard, RouteGuard],
        data: { rolesValidos: ["Admin", "AdultoResponsable"] },
        component: SolicitudReunionAdultoResponsableComponent,
      },
      {
        path: "visualizarEvento",
        component: VisualizarEventoComponent,
        canActivate: [RoleGuard, RouteEventoGuard],
      },
      {
        path: "alta",
        component: AltaEstudiantesComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] },
      },
      {
        path: "buscar",
        component: BuscarEstudiantesComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] },
        children: [
          {
            path: "lista",
            component: ListaEstudiantesComponent,
            canActivate: [RoleGuard],
            data: {
              rolesValidos: ["Admin", "Preceptor", "Director", "Docente"],
            },
          },
        ],
      },
      {
        path: "mostrar",
        component: MostrarEstudiantesComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] },
      },
      {
        path: "asistencia",
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] },
        component: RegistrarAsistenciaComponent,
      },
      {
        path: "inscribirEstudiante",
        component: InscripcionEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] },
      },
      {
        path: "registrarSancion",
        component: RegistrarSancionesComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] },
      },
      {
        path: "solicitudReunion",
        component: SolicitudReunionComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] },
      },
      {
        path: "retiroAnticipado",
        component: RetiroAnticipadoComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] },
      },
      {
        path: "documentosEstudiante",
        component: DocumentosInscripcionComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] },
      },
      {
        path: "calificacionesEstudiantes",
        component: CalificacionesEstudiantesComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] },
      },
      {
        path: "calificacionesCicloLectivo",
        component: CalificacionesCicloLectivoComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director", "Docente"] },
      },
      {
        path: "registrarCuotas",
        component: RegistrarCuotasComponent,
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] },
      },
      {
        path: "calificacionesExamenes",
        component: CalificacionesExamenesComponent,
        canActivate: [RoleGuard, RouteGuard],
        data: { rolesValidos: ["Admin", "Docente", "Director"] },
      },
      {
        path: "llegadaTarde",
        component: LlegadaTardeComponent,
        canActivate: [RoleGuard, RouteGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] },
      },
      { path: "cambiarContraseña", component: CambiarPassword },
      {
        path: "perfilEstudiante",
        component: PerfilEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: {
          rolesValidos: [
            "Admin",
            "Preceptor",
            "Director",
            "Docente",
            "AdultoResponsable",
          ],
        },
      },
      {
        path: "calificacionesPerfilEstudiante",
        component: CalificacionesPerfilEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: {
          rolesValidos: [
            "Admin",
            "Preceptor",
            "Director",
            "Docente",
            "AdultoResponsable",
          ],
        },
      },
      {
        path: "inasistenciasPerfilEstudiante",
        component: InasistenciasEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: {
          rolesValidos: [
            "Admin",
            "Preceptor",
            "Director",
            "Docente",
            "AdultoResponsable",
          ],
        },
      },
      {
        path: "cuotasPerfilEstudiante",
        component: CuotasPerfilEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: {
          rolesValidos: [
            "Admin",
            "Preceptor",
            "Director",
            "Docente",
            "AdultoResponsable",
          ],
        },
      },
      {
        path: "agendaCursoPerfilEstudiante",
        component: AgendaCursoPerfilEstudianteComponent,
        canActivate: [RoleGuard, RouteGuard],
        data: {
          rolesValidos: [
            "Admin",
            "Preceptor",
            "Director",
            "Docente",
            "AdultoResponsable",
          ],
        },
      },
      {
        path: "sancionesPerfilEstudiante",
        component: SancionesEstudianteComponent,
        canActivate: [RoleGuard, RouteGuard],
        data: {
          rolesValidos: [
            "Admin",
            "Preceptor",
            "Director",
            "Docente",
            "AdultoResponsable",
          ],
        },
      },
      {
        path: "tutoresPerfilEstudiante",
        component: TutoresEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: {
          rolesValidos: [
            "Admin",
            "Preceptor",
            "Director",
            "Docente",
            "AdultoResponsable",
          ],
        },
      },
      {
        path: "datosPerfilEstudiante",
        component: DatosEstudianteComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: {
          rolesValidos: [
            "Admin",
            "Preceptor",
            "Director",
            "Docente",
            "AdultoResponsable",
          ],
        },
      },
      {
        path: "justificarInasistencia",
        component: JustificacionInasistenciaComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Preceptor", "Director"] },
      },

      {
        path: "altaEmpleado",
        component: AltaEmpleadoComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Director"] },
      },
      {
        path: "altaAdultoResponsable",
        component: AltaAdultoResponsableComponent,
        canActivate: [RouteGuard, RoleGuard],
        data: { rolesValidos: ["Admin", "Director", "Preceptor"] },
      },
      {
        path: "registrarEvento",
        component: RegistrarEventoComponent,
        canActivate: [RoleGuard],
        data: { rolesValidos: ["Admin", "Director", "Preceptor", "Docente"] },
      },
      {
        path: "modificarEvento",
        component: ModificarEventoComponent,
        canActivate: [RoleGuard, RouteEventoGuard],
        data: { rolesValidos: ["Admin", "Director", "Preceptor", "Docente"] },
      },
      {
        path: "preferencias",
        component: PreferenciasComponent,
        canActivate: [RoleGuard],
        data: {
          rolesValidos: [
            "Admin",
            "Preceptor",
            "Director",
            "Docente",
            "AdultoResponsable",
          ],
        },
      },
      {
        path: "visualizarAgenda",
        component: VisualizarAgendaComponent,
        canActivate: [RoleGuard],
        data: {
          rolesValidos: ["Admin", "Preceptor", "Director", "Docente"],
        },
      },
      {
        path: "inscripcionCurso",
        component: InscripcionCursoComponent,
        canActivate: [RoleGuard],
        data: {
          rolesValidos: ["Admin", "Preceptor", "Director"],
        },
      },
      {
        path: "accionesDirector",
        component: AccionesDirectorComponent,
        canActivate: [RoleGuard],
        data: {
          rolesValidos: ["Admin", "Director"],
        },
      },
      {
        path: "reglasDeNegocio",
        component: ParametrizarReglasNegocioComponent,
        canActivate: [RoleGuard],
        data: {
          rolesValidos: ["Admin", "Director"],
        },
      },
      {
        path: "estadoCursos",
        component: EstadoCursosComponent,
        canActivate: [RoleGuard],
        data: {
          rolesValidos: ["Admin", "Director"],
        },
      },
      {
        path: "estadoCicloLectivo",
        component: CicloLectivoComponent,
        canActivate: [RoleGuard],
        data: {
          rolesValidos: ["Admin", "Director"],
        },
      },
      {
        path: "buscarAdultoResponsable",
        component: BuscarAdultoResponsableComponent,
        canActivate: [RoleGuard],
        data: {
          rolesValidos: ["Admin", "Preceptor", "Director"],
        },
      },
      {
        path: "asociarAdultoResponsable",
        component: AsociarAdultoResponsableComponent,
        canActivate: [RoleGuard, RouteGuard],
        data: {
          rolesValidos: ["Admin", "Preceptor", "Director"],
        },
      },
      {
        path: "documentosAdeudados",
        component: DocAdeudadosComponent,
      },
      {
        path: "reportes",
        component: ReportesComponent,
      },
      {
        path: "cuotasAdeudadas",
        component: CuotasAdeudadasComponent,
      },
      {
        path: "resumenAcademico",
        component: ResumenAcademicoComponent,
      },
      {
        path: "reporteResumenAcademico",
        component: ReporteResumenAcademicoComponent,
      },
      {
        path: "rendimientoCurso",
        component: RendimientoCursoComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard, RouteGuard, RoleGuard, RouteEventoGuard],
})
export class AppRoutingModule {}
