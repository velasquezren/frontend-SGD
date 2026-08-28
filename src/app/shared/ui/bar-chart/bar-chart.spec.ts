import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { UiBarChart, type BarChartDatum } from './bar-chart';

@Component({
  imports: [UiBarChart],
  template: `<ui-bar-chart [data]="data" />`,
})
class HostComponent {
  data: BarChartDatum[] = [];
}

function setup(data: BarChartDatum[]): ComponentFixture<HostComponent> {
  TestBed.configureTestingModule({ imports: [HostComponent] });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.data = data;
  fixture.detectChanges();
  return fixture;
}

describe('UiBarChart', () => {
  it('shows the empty message when there is no data', () => {
    const fixture = setup([]);
    expect(fixture.nativeElement.textContent).toContain('Sin datos');
    expect(fixture.nativeElement.querySelectorAll('.bar-chart__row')).toHaveLength(0);
  });

  it('scales the largest bar to 100% and renders every row', () => {
    const fixture = setup([
      { label: 'Radiología', value: 10 },
      { label: 'Admisión', value: 5 },
    ]);

    const fills: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.bar-chart__fill'));
    expect(fills).toHaveLength(2);
    expect(fills[0].style.inlineSize).toBe('100%');
    expect(fills[1].style.inlineSize).toBe('50%');
  });

  it('gives a zero-value bar no width, but a floor to a small nonzero one', () => {
    const fixture = setup([
      { label: 'A', value: 100 },
      { label: 'B', value: 0 },
      { label: 'C', value: 1 },
    ]);

    const fills: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.bar-chart__fill'));
    expect(fills[1].style.inlineSize).toBe('0%');
    expect(fills[2].style.inlineSize).toBe('3%');
  });
});
