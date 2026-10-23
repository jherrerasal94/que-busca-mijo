import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarDestacadosComponent } from './gestionar-destacados.component';

describe('GestionarDestacadosComponent', () => {
  let component: GestionarDestacadosComponent;
  let fixture: ComponentFixture<GestionarDestacadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarDestacadosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarDestacadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
