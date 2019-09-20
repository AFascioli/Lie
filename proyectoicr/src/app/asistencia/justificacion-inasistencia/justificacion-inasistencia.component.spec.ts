import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JustificacionInasistenciaComponent } from './justificacion-inasistencia.component';

describe('JustificacionInasistenciaComponent', () => {
  let component: JustificacionInasistenciaComponent;
  let fixture: ComponentFixture<JustificacionInasistenciaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JustificacionInasistenciaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JustificacionInasistenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
