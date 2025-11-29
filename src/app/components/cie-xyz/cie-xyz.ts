import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-cie-xyz',
  standalone: true,
  templateUrl: './cie-xyz.html',
  styleUrls: ['./cie-xyz.scss']
})
export class CieXYZ implements AfterViewInit, OnDestroy {
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
      this.rotation += 0.2;

      const svg = this.svgContainer.nativeElement;
      const group = svg.querySelector('.rotating-group');
      if (group) {
        group.setAttribute('transform', `rotate(${this.rotation} 200 200)`);
      }
    };

    animate();
  }

  // Generar la forma de herradura del diagrama CIE
  getHorseshoePath(): string {
    const cx = 200;
    const cy = 220;

    // Puntos aproximados de la forma de herradura CIE
    const points = [
      // Lado izquierdo (violeta a verde)
      [cx - 120, cy - 80], [cx - 130, cy - 60], [cx - 135, cy - 40],
      [cx - 135, cy - 20], [cx - 130, cy], [cx - 120, cy + 20],
      [cx - 100, cy + 40], [cx - 75, cy + 55], [cx - 45, cy + 65],
      // Parte superior (verde a rojo)
      [cx - 15, cy + 70], [cx + 15, cy + 70], [cx + 45, cy + 65],
      [cx + 75, cy + 55], [cx + 100, cy + 40], [cx + 115, cy + 20],
      [cx + 125, cy], [cx + 128, cy - 20], [cx + 125, cy - 40],
      [cx + 115, cy - 60], [cx + 100, cy - 80],
      // Línea de púrpuras (rojo a violeta)
      [cx - 120, cy - 80]
    ];

    const pathData = points.map((p, i) =>
      i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`
    ).join(' ') + ' Z';

    return pathData;
  }

  getWavelengthPoints(): Array<{x: number, y: number, wl: number, color: string}> {
    const cx = 200;
    const cy = 220;

    return [
      { x: cx - 120, y: cy - 80, wl: 380, color: '#8B00FF' },
      { x: cx - 135, y: cy - 20, wl: 450, color: '#0000FF' },
      { x: cx - 100, y: cy + 40, wl: 490, color: '#00FFFF' },
      { x: cx - 15, y: cy + 70, wl: 520, color: '#00FF00' },
      { x: cx + 45, y: cy + 65, wl: 560, color: '#FFFF00' },
      { x: cx + 115, y: cy + 20, wl: 600, color: '#FF7F00' },
      { x: cx + 100, y: cy - 80, wl: 700, color: '#FF0000' }
    ];
  }
}
