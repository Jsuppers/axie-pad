import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarningsMoreInfoComponent } from './earnings-more-info.component';

describe('EarningsMoreInfoComponent', () => {
  let component: EarningsMoreInfoComponent;
  let fixture: ComponentFixture<EarningsMoreInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EarningsMoreInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EarningsMoreInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
