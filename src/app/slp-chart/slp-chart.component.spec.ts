import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlpChartComponent } from './slp-chart.component';

describe('SlpChartComponent', () => {
  let component: SlpChartComponent;
  let fixture: ComponentFixture<SlpChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SlpChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SlpChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
