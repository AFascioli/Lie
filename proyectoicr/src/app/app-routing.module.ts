import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AltaEstudiantesComponent } from './estudiantes/alta-estudiantes/alta-estudiantes.component';
import { BuscarEstudiantesComponent } from './estudiantes/buscar-estudiantes/buscar-estudiantes.component';
import { ListaEstudiantesComponent } from './estudiantes/lista-estudiantes/lista-estudiantes.component';
import { MostrarEstudiantesComponent } from './estudiantes/mostrar-estudiantes/mostrar-estudiantes.component';


const routes: Routes = [
  // { path: '', component:  },
  { path: 'alta', component: AltaEstudiantesComponent  },
  { path: 'buscar', component: BuscarEstudiantesComponent  },
  { path: 'listar', component: ListaEstudiantesComponent  },
  { path: 'mostrar', component: MostrarEstudiantesComponent  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
