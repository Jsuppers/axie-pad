import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkTableDialogComponent } from './link-table-dialog.component';

describe('LinkTableDialogComponent', () => {
  let component: LinkTableDialogComponent;
  let fixture: ComponentFixture<LinkTableDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LinkTableDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkTableDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
