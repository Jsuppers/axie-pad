import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreedProfitTableComponent } from './breed-profit-table.component';

describe('BreedProfitTableComponent', () => {
  let component: BreedProfitTableComponent;
  let fixture: ComponentFixture<BreedProfitTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BreedProfitTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BreedProfitTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
