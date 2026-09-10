import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicacionCardComponent } from './publicacion-card.component';

describe('PublicacionCardComponent', () => {
  let component: PublicacionCardComponent;
  let fixture: ComponentFixture<PublicacionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicacionCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicacionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
