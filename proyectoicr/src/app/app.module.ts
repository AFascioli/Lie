import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatInputModule,
          MatSelectModule,
          MatButtonModule,
          MatCardModule,
          MatFormFieldModule,
          MatNativeDateModule,
          MatAutocompleteModule,
          MatRadioModule,
          MatTableModule,
          MatSidenavModule
        } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatDatepickerModule} from '@angular/material/datepicker';

import { AppComponent } from './app.component';
import { AltaEstudiantesComponent } from './estudiantes/alta-estudiantes/alta-estudiantes.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EstudiantesService } from './estudiantes/estudiante.service';
import { BuscarEstudiantesComponent } from './estudiantes/buscar-estudiantes/buscar-estudiantes.component';
import { ListaEstudiantesComponent } from './estudiantes/lista-estudiantes/lista-estudiantes.component';
import { MostrarEstudiantesComponent } from './estudiantes/mostrar-estudiantes/mostrar-estudiantes.component';

@NgModule({
  declarations: [
    AppComponent,
    AltaEstudiantesComponent,
    BuscarEstudiantesComponent,
    ListaEstudiantesComponent,
    MostrarEstudiantesComponent
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
    MatSidenavModule
  ],
  providers: [EstudiantesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
