import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScholarMoreInfoComponent } from './scholar-more-info.component';

describe('ScholarMoreInfoComponent', () => {
  let component: ScholarMoreInfoComponent;
  let fixture: ComponentFixture<ScholarMoreInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScholarMoreInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScholarMoreInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
