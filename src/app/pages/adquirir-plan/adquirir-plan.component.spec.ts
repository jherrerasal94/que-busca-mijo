import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdquirirPlanComponent } from './adquirir-plan.component';

describe('AdquirirPlanComponent', () => {
  let component: AdquirirPlanComponent;
  let fixture: ComponentFixture<AdquirirPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdquirirPlanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdquirirPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
