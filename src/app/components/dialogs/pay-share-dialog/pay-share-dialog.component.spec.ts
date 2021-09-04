import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayShareDialogComponent } from './pay-share-dialog.component';

describe('PayShareDialogComponent', () => {
  let component: PayShareDialogComponent;
  let fixture: ComponentFixture<PayShareDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayShareDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PayShareDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
