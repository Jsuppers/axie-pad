import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopEarnersComponent } from './top-earners.component';

describe('TopEarnersComponent', () => {
  let component: TopEarnersComponent;
  let fixture: ComponentFixture<TopEarnersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopEarnersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopEarnersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
