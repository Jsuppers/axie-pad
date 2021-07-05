import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EarningsTableComponent } from './earnings-table.component';

describe('TableComponent', () => {
  let component: EarningsTableComponent;
  let fixture: ComponentFixture<EarningsTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EarningsTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EarningsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
