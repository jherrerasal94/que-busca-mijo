import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarPlanesComponent } from './gestionar-planes.component';

describe('GestionarPlanesComponent', () => {
  let component: GestionarPlanesComponent;
  let fixture: ComponentFixture<GestionarPlanesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarPlanesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarPlanesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
