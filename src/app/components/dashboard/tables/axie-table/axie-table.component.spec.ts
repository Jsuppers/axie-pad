import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AxieTableComponent } from './axie-table.component';

describe('AxieTableComponent', () => {
  let component: AxieTableComponent;
  let fixture: ComponentFixture<AxieTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AxieTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AxieTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
