import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inactivos } from './inactivos';

describe('Inactivos', () => {
  let component: Inactivos;
  let fixture: ComponentFixture<Inactivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inactivos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inactivos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
