import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-cie1931-chromaticity',
  standalone: true,
  templateUrl: './cie1931-chromaticity.html',
  styleUrls: ['./cie1931-chromaticity.scss']
})
export class Cie1931Chromaticity implements AfterViewInit {
  @ViewChild('cieCanvas', { static: true })
  cieCanvas!: ElementRef<HTMLCanvasElement>;

  private width = 480;
  private height = 360;

  ngAfterViewInit(): void {
    this.drawDiagram();
  }

  private drawDiagram(): void {
    const canvas = this.cieCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = this.width;
    canvas.height = this.height;

    // Fondo
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, this.width, this.height);

    // Dibujar cromaticidad aproximada
    this.drawChromaticityBackground(ctx);

    // Ejes x-y
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.lineWidth = 1;
    const marginLeft = 40;
    const marginBottom = 30;

    ctx.beginPath();
    ctx.moveTo(marginLeft, this.height - marginBottom);
    ctx.lineTo(this.width - 20, this.height - marginBottom); // eje x
    ctx.moveTo(marginLeft, this.height - marginBottom);
    ctx.lineTo(marginLeft, 20); // eje y
    ctx.stroke();

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText('x', this.width - 25, this.height - 12);
    ctx.fillText('y', 26, 30);

    // Marcas simples
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
  }

  private drawChromaticityBackground(ctx: CanvasRenderingContext2D): void {
    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width; i++) {
        // Convertimos pixel → coordenadas CIE (x,y) aproximadas
        const x = this.xFromPixel(i);
        const y = this.yFromPixel(j);

        // Rango básico del diagrama
        if (x < 0 || y < 0 || x + y > 1 || x > 0.8 || y > 0.9) {
          continue;
        }

        // Convertimos xyY → XYZ (Y = 1)
        const Y = 1;
        const X = (x / y) * Y;
        const Z = ((1 - x - y) / y) * Y;

        // XYZ → RGB lineal (matriz sRGB aproximada)
        let R = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
        let G = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
        let B = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;

        // Si alguno es claramente fuera de rango, lo descartamos
        if (R < 0 || G < 0 || B < 0) continue;

        // Corrección gamma sRGB
        const gammaCorrect = (c: number) =>
          c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

        R = gammaCorrect(R);
        G = gammaCorrect(G);
        B = gammaCorrect(B);

        if (!isFinite(R) || !isFinite(G) || !isFinite(B)) continue;

        const idx = (j * this.width + i) * 4;
        data[idx] = Math.max(0, Math.min(255, R * 255));
        data[idx + 1] = Math.max(0, Math.min(255, G * 255));
        data[idx + 2] = Math.max(0, Math.min(255, B * 255));
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Mapeos entre (x,y) y pixeles

  private xFromPixel(i: number): number {
    const marginLeft = 40;
    const marginRight = 20;
    const usableWidth = this.width - marginLeft - marginRight;
    return ((i - marginLeft) / usableWidth) * 0.8; // x ∈ [0,0.8]
  }

  private yFromPixel(j: number): number {
    const marginTop = 20;
    const marginBottom = 30;
    const usableHeight = this.height - marginTop - marginBottom;
    // y crece de abajo arriba
    return ((this.height - marginBottom - j) / usableHeight) * 0.9; // y ∈ [0,0.9]
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
}
