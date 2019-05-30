import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaEstudiantesComponent } from './alta-estudiantes.component';

describe('AltaEstudiantesComponent', () => {
  let component: AltaEstudiantesComponent;
  let fixture: ComponentFixture<AltaEstudiantesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AltaEstudiantesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AltaEstudiantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
