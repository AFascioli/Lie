import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadoCursosComponent } from './estado-cursos.component';

describe('EstadoCursosComponent', () => {
  let component: EstadoCursosComponent;
  let fixture: ComponentFixture<EstadoCursosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EstadoCursosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EstadoCursosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
