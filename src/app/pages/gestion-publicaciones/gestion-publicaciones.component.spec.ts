import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPublicacionesComponent } from './gestion-publicaciones.component';

describe('GestionPublicacionesComponent', () => {
  let component: GestionPublicacionesComponent;
  let fixture: ComponentFixture<GestionPublicacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPublicacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPublicacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
