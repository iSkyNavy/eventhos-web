import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventContractsComponent } from './event-contracts.component';

describe('EventContractsComponent', () => {
  let component: EventContractsComponent;
  let fixture: ComponentFixture<EventContractsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventContractsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventContractsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
