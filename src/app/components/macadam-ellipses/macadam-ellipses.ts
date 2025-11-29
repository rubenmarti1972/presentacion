import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
}

@Component({
  selector: 'app-macadam-ellipses',
  standalone: true,
  templateUrl: './macadam-ellipses.html',
  styleUrls: ['./macadam-ellipses.scss']
})
export class MacadamEllipses implements AfterViewInit, OnDestroy {
  @ViewChild('svgContainer', { static: true })
  svgContainer!: ElementRef<SVGSVGElement>;

  private animationFrameId: number | null = null;
  private rotation = 0;

  ngAfterViewInit(): void {
    this.startAnimation();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private startAnimation(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.rotation += 0.15;

      const svg = this.svgContainer.nativeElement;
      const group = svg.querySelector('.rotating-group');
      if (group) {
        group.setAttribute('transform', `rotate(${this.rotation} 200 200)`);
      }
    };

    animate();
  }

  // Forma de herradura del diagrama CIE (simplificada)
  getHorseshoePath(): string {
    const cx = 200;
    const cy = 220;

    const points = [
      [cx - 120, cy - 80], [cx - 130, cy - 60], [cx - 135, cy - 40],
      [cx - 135, cy - 20], [cx - 130, cy], [cx - 120, cy + 20],
      [cx - 100, cy + 40], [cx - 75, cy + 55], [cx - 45, cy + 65],
      [cx - 15, cy + 70], [cx + 15, cy + 70], [cx + 45, cy + 65],
      [cx + 75, cy + 55], [cx + 100, cy + 40], [cx + 115, cy + 20],
      [cx + 125, cy], [cx + 128, cy - 20], [cx + 125, cy - 40],
      [cx + 115, cy - 60], [cx + 100, cy - 80],
      [cx - 120, cy - 80]
    ];

    const pathData = points.map((p, i) =>
      i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`
    ).join(' ') + ' Z';

    return pathData;
  }

  // Elipses de MacAdam (magnificadas 10x para visualización)
  getMacadamEllipses(): Ellipse[] {
    const scale = 10; // Magnificación para visualización
    return [
      { cx: 180, cy: 240, rx: 8 * scale, ry: 4 * scale, rotation: 30 },
      { cx: 200, cy: 220, rx: 6 * scale, ry: 3 * scale, rotation: 0 },
      { cx: 220, cy: 240, rx: 7 * scale, ry: 3.5 * scale, rotation: -20 },
      { cx: 170, cy: 260, rx: 9 * scale, ry: 4 * scale, rotation: 45 },
      { cx: 230, cy: 260, rx: 8 * scale, ry: 4.5 * scale, rotation: -35 },
      { cx: 190, cy: 200, rx: 5 * scale, ry: 2.5 * scale, rotation: 15 },
      { cx: 210, cy: 200, rx: 6 * scale, ry: 3 * scale, rotation: -10 },
      { cx: 160, cy: 220, rx: 7 * scale, ry: 3.5 * scale, rotation: 50 },
      { cx: 240, cy: 220, rx: 6.5 * scale, ry: 3 * scale, rotation: -40 },
    ];
  }
}
