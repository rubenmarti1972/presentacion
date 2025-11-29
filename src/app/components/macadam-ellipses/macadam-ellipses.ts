import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

interface MacadamEllipse {
  x: number;   // centro x
  y: number;   // centro y
  rx: number;  // radio eje mayor (en coordenadas x-y)
  ry: number;  // radio eje menor
  angle: number; // rotación en radianes
}

@Component({
  selector: 'app-macadam-ellipses',
  standalone: true,
  templateUrl: './macadam-ellipses.html',
  styleUrls: ['./macadam-ellipses.scss']
})
export class MacadamEllipses implements AfterViewInit {
  @ViewChild('macadamCanvas', { static: true })
  macadamCanvas!: ElementRef<HTMLCanvasElement>;

  private width = 480;
  private height = 360;

  // Algunos centros aproximados de MacAdam (didáctico, no exacto)
  private ellipses: MacadamEllipse[] = [
    { x: 0.31, y: 0.33, rx: 0.02, ry: 0.008, angle: 20 * Math.PI / 180 },
    { x: 0.21, y: 0.47, rx: 0.025, ry: 0.010, angle: -10 * Math.PI / 180 },
    { x: 0.15, y: 0.06, rx: 0.018, ry: 0.007, angle: 15 * Math.PI / 180 },
    { x: 0.44, y: 0.40, rx: 0.02, ry: 0.009, angle: 30 * Math.PI / 180 },
    { x: 0.25, y: 0.35, rx: 0.018, ry: 0.007, angle: -25 * Math.PI / 180 }
  ];

  ngAfterViewInit(): void {
    this.drawDiagramWithEllipses();
  }

  private drawDiagramWithEllipses(): void {
    const canvas = this.macadamCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = this.width;
    canvas.height = this.height;

    // Fondo
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, this.width, this.height);

    // Fondo cromático ligero (no tan costoso como el anterior)
    this.drawSoftChromaticBackground(ctx);

    // Ejes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.lineWidth = 1;
    const marginLeft = 40;
    const marginBottom = 30;

    ctx.beginPath();
    ctx.moveTo(marginLeft, this.height - marginBottom);
    ctx.lineTo(this.width - 20, this.height - marginBottom); // x
    ctx.moveTo(marginLeft, this.height - marginBottom);
    ctx.lineTo(marginLeft, 20); // y
    ctx.stroke();

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '11px system-ui';
    ctx.fillText('x', this.width - 25, this.height - 12);
    ctx.fillText('y', 26, 30);

    // Marcas
    ctx.fillStyle = '#9ca3af';
    for (let x = 0; x <= 0.8; x += 0.2) {
      const px = this.mapX(x);
      ctx.beginPath();
      ctx.moveTo(px, this.height - marginBottom);
      ctx.lineTo(px, this.height - marginBottom + 4);
      ctx.stroke();
      ctx.fillText(x.toFixed(1), px - 8, this.height - 10);
    }

    for (let y = 0; y <= 0.9; y += 0.3) {
      const py = this.mapY(y);
      ctx.beginPath();
      ctx.moveTo(marginLeft, py);
      ctx.lineTo(marginLeft - 4, py);
      ctx.stroke();
      ctx.fillText(y.toFixed(1), 14, py + 3);
    }

    // Elipses de MacAdam
    this.drawMacadamEllipses(ctx);
  }

  private drawSoftChromaticBackground(ctx: CanvasRenderingContext2D): void {
    const step = 3; // para no matar la CPU

    for (let j = 0; j < this.height; j += step) {
      for (let i = 0; i < this.width; i += step) {
        const x = this.xFromPixel(i);
        const y = this.yFromPixel(j);

        if (x < 0 || y < 0 || x + y > 1 || x > 0.8 || y > 0.9) continue;

        // xyY → XYZ (Y=1)
        const Y = 1;
        const X = (x / y) * Y;
        const Z = ((1 - x - y) / y) * Y;

        let R = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
        let G = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
        let B = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;

        if (R < 0 || G < 0 || B < 0) continue;

        const gammaCorrect = (c: number) =>
          c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

        R = gammaCorrect(R);
        G = gammaCorrect(G);
        B = gammaCorrect(B);

        if (!isFinite(R) || !isFinite(G) || !isFinite(B)) continue;

        ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, R * 255))},
                             ${Math.max(0, Math.min(255, G * 255))},
                             ${Math.max(0, Math.min(255, B * 255))})`;
        ctx.fillRect(i, j, step, step);
      }
    }
  }

  private drawMacadamEllipses(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#f97316';
    ctx.setLineDash([4, 3]);

    this.ellipses.forEach((e) => {
      const cx = this.mapX(e.x);
      const cy = this.mapY(e.y);
      const rx = this.scaleX(e.rx);
      const ry = this.scaleY(e.ry);

      ctx.beginPath();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(e.angle);
      ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);
      ctx.restore();
      ctx.stroke();
    });

    ctx.setLineDash([]);

    // Pequeña leyenda
    ctx.fillStyle = '#f97316';
    ctx.fillRect(this.width - 170, 26, 14, 3);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '11px system-ui';
    ctx.fillText('Elipses de MacAdam (regiones de indistinguibilidad)', this.width - 150, 32);
  }

  // Mapeos

  private xFromPixel(i: number): number {
    const marginLeft = 40;
    const marginRight = 20;
    const usableWidth = this.width - marginLeft - marginRight;
    return ((i - marginLeft) / usableWidth) * 0.8;
  }

  private yFromPixel(j: number): number {
    const marginTop = 20;
    const marginBottom = 30;
    const usableHeight = this.height - marginTop - marginBottom;
    return ((this.height - marginBottom - j) / usableHeight) * 0.9;
  }

  private mapX(x: number): number {
    const marginLeft = 40;
    const marginRight = 20;
    const usableWidth = this.width - marginLeft - marginRight;
    return marginLeft + (x / 0.8) * usableWidth;
  }

  private mapY(y: number): number {
    const marginTop = 20;
    const marginBottom = 30;
    const usableHeight = this.height - marginTop - marginBottom;
    return this.height - marginBottom - (y / 0.9) * usableHeight;
  }

  private scaleX(dx: number): number {
    const marginLeft = 40;
    const marginRight = 20;
    const usableWidth = this.width - marginLeft - marginRight;
    return (dx / 0.8) * usableWidth;
  }

  private scaleY(dy: number): number {
    const marginTop = 20;
    const marginBottom = 30;
    const usableHeight = this.height - marginTop - marginBottom;
    return (dy / 0.9) * usableHeight;
  }
}
