import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-helmholtz-diagram',
  standalone: true,
  templateUrl: './helmholtz-diagram.html',
  styleUrls: ['./helmholtz-diagram.scss']
})
export class HelmholtzDiagram implements AfterViewInit, OnDestroy {
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
      this.rotation += 0.3;

      const svg = this.svgContainer.nativeElement;
      const group = svg.querySelector('.rotating-group');
      if (group) {
        group.setAttribute('transform', `rotate(${this.rotation} 200 200)`);
      }
    };

    animate();
  }

  // Generar la curva espectral (horseshoe shape simplificada)
  getSpectralPath(): string {
    const cx = 200;
    const cy = 200;
    const r = 120;

    // Curva espectral simplificada
    const points: string[] = [];
    for (let angle = 60; angle <= 300; angle += 10) {
      const rad = (angle * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      points.push(`${x},${y}`);
    }

    return `M ${points.join(' L ')}`;
  }

  // Obtener colores para el gradiente del espectro
  getSpectralColor(index: number, total: number): string {
    const wavelengths = [
      '#8B00FF', // Violeta
      '#0000FF', // Azul
      '#00FFFF', // Cyan
      '#00FF00', // Verde
      '#FFFF00', // Amarillo
      '#FF7F00', // Naranja
      '#FF0000'  // Rojo
    ];

    const ratio = index / total;
    const colorIndex = Math.floor(ratio * (wavelengths.length - 1));
    return wavelengths[Math.min(colorIndex, wavelengths.length - 1)];
  }
}
