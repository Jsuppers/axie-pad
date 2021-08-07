import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AverageColorDialogComponent } from './average-color-dialog.component';

describe('AverageColorDialogComponent', () => {
  let component: AverageColorDialogComponent;
  let fixture: ComponentFixture<AverageColorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AverageColorDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AverageColorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
