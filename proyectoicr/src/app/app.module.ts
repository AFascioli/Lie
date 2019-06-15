import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
//import {CustomMaterialModule} from './core/material.module';
import { MatInputModule,
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
          MatListModule
        } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatMenuModule, MatMenu} from '@angular/material/menu';

import { AppComponent } from './app.component';
import { AltaEstudiantesComponent, DialogoPopupComponent } from './estudiantes/alta-estudiantes/alta-estudiantes.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EstudiantesService } from './estudiantes/estudiante.service';
import { BuscarEstudiantesComponent } from './estudiantes/buscar-estudiantes/buscar-estudiantes.component';
import { ListaEstudiantesComponent, MostrarPopupComponent } from './estudiantes/lista-estudiantes/lista-estudiantes.component';
import { MostrarEstudiantesComponent } from './estudiantes/mostrar-estudiantes/mostrar-estudiantes.component';
import { AppRoutingModule } from './app-routing.module';
import { MenuPrincipalComponent } from './menu-principal/menu-principal.component';
import { MenuLateralComponent } from './menu-lateral/menu-lateral.component';

@NgModule({
  declarations: [
    AppComponent,
    AltaEstudiantesComponent,
    BuscarEstudiantesComponent,
    ListaEstudiantesComponent,
    MostrarEstudiantesComponent,
    DialogoPopupComponent,
    MostrarPopupComponent,
    MenuPrincipalComponent,
    MenuLateralComponent
  ],
  //entryComponents declara los componentes que se generan dinamicamente dentro de otros.
  entryComponents: [DialogoPopupComponent, MostrarPopupComponent],
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
 //   CustomMaterialModule
  ],
  providers: [EstudiantesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
