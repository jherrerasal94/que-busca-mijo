import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarAnalyticsComponent } from './gestionar-analytics.component';

describe('GestionarAnalyticsComponent', () => {
  let component: GestionarAnalyticsComponent;
  let fixture: ComponentFixture<GestionarAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
