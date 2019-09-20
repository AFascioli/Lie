import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaARComponent } from './alta-ar.component';

describe('AltaARComponent', () => {
  let component: AltaARComponent;
  let fixture: ComponentFixture<AltaARComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AltaARComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AltaARComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
