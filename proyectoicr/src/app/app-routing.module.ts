import { HomeComponent } from "./home/home.component";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AltaEstudiantesComponent } from "./estudiantes/alta-estudiantes/alta-estudiantes.component";
import { BuscarEstudiantesComponent } from "./estudiantes/buscar-estudiantes/buscar-estudiantes.component";
import { ListaEstudiantesComponent } from "./estudiantes/lista-estudiantes/lista-estudiantes.component";
import { MostrarEstudiantesComponent } from "./estudiantes/mostrar-estudiantes/mostrar-estudiantes.component";
import { MenuLateralComponent } from "./menu-lateral/menu-lateral.component";
import { MenuPrincipalComponent } from "./menu-principal/menu-principal.component";
import { RegistrarAsistenciaComponent } from "./asistencia/registrar-asistencia/registrar-asistencia.component";
import { InscripcionEstudianteComponent } from './estudiantes/inscripcion-estudiantes/inscripcion-estudiantes.component';
import { RetiroAnticipadoComponent } from './asistencia/retiro-anticipado/retiro-anticipado.component';
import { DocumentosInscripcionComponent } from './estudiantes/documentos-inscripcion/documentos-inscripcion.component';
import{ CalificacionesEstudiantesComponent } from './estudiantes/calificaciones-estudiantes/calificaciones-estudiantes.component';
import { LlegadaTardeComponent } from './asistencia/llegada-tarde/llegada-tarde.component';

const routes: Routes = [
  { path: "", component: MenuPrincipalComponent },
  {
    path: "menuLateral",
    component: MenuLateralComponent,
    children: [
      { path: "home", component: HomeComponent },
      { path: "alta", component: AltaEstudiantesComponent },
      {
        path: "buscar",
        component: BuscarEstudiantesComponent,
        children: [{ path: "lista", component: ListaEstudiantesComponent }]
      },
      { path: "mostrar", component: MostrarEstudiantesComponent },
      { path: "asistencia", component: RegistrarAsistenciaComponent },
      { path: "curso", component: InscripcionEstudianteComponent },
      { path: "retiroAnticipado", component: RetiroAnticipadoComponent },
      { path: "documentosEstudiante", component: DocumentosInscripcionComponent },
      { path: "calificacionesEstudiantes", component: CalificacionesEstudiantesComponent },
      { path: "llegadaTarde", component: LlegadaTardeComponent},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
