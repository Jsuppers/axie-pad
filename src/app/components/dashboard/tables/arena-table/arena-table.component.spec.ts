import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ArenaTableComponent } from './arena-table.component';


describe('ArenaTableComponent', () => {
  let component: ArenaTableComponent;
  let fixture: ComponentFixture<ArenaTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArenaTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArenaTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
