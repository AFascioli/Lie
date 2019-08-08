import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalificacionesEstudiantesComponent } from './calificaciones-estudiantes.component';

describe('CalificacionesEstudiantesComponent', () => {
  let component: CalificacionesEstudiantesComponent;
  let fixture: ComponentFixture<CalificacionesEstudiantesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalificacionesEstudiantesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalificacionesEstudiantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
