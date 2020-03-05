import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarCuotasComponent } from './registrar-cuotas.component';

describe('RegistrarCuotasComponent', () => {
  let component: RegistrarCuotasComponent;
  let fixture: ComponentFixture<RegistrarCuotasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegistrarCuotasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrarCuotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
