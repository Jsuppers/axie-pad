import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Scholar } from 'src/app/_models/scholar';

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

  describe('#getAverageSLP', () => {
    it('should correctly calculate if first day' , () => {
      const dateNow = new Date();
      const scholar = {
        slp: {
          inProgress: 400,
          lastClaimed: (dateNow.getTime() / 1000) + 30,
        }
      } as Scholar;
      const averageSLP = component.getAverageSLP(scholar, dateNow);
      expect(averageSLP).toEqual(400);
    });
  })
});
