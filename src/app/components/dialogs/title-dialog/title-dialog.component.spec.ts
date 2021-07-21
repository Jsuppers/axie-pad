import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TitleDialogComponent } from './title-dialog.component';

describe('TitleDialogComponent', () => {
  let component: TitleDialogComponent;
  let fixture: ComponentFixture<TitleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TitleDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TitleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
