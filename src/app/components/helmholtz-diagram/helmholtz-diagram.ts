import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-helmholtz-diagram',
  standalone: true,
  templateUrl: './helmholtz-diagram.html',
  styleUrls: ['./helmholtz-diagram.scss']
})
export class HelmholtzDiagram implements AfterViewInit {
  @ViewChild('curveCanvas', { static: true })
  curveCanvas!: ElementRef<HTMLCanvasElement>;

  private width = 480;
  private height = 260;

  ngAfterViewInit(): void {
    this.drawCurves();
  }

  private drawCurves(): void {
    const canvas = this.curveCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = this.width;
    canvas.height = this.height;

    // Fondo
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, this.width, this.height);

    // Ejes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, this.height - 30);
    ctx.lineTo(this.width - 10, this.height - 30);
    ctx.moveTo(40, this.height - 30);
    ctx.lineTo(40, 20);
    ctx.stroke();

    // Texto ejes
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '11px system-ui';
    ctx.fillText('Longitud de onda (nm)', this.width / 2 - 50, this.height - 10);
    ctx.save();
    ctx.translate(15, this.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Sensibilidad relativa', -50, 0);
    ctx.restore();

    // Marcas en eje x (400–700 nm)
    ctx.fillStyle = '#9ca3af';
    for (let λ = 400; λ <= 700; λ += 50) {
      const x = this.xFromLambda(λ);
      ctx.beginPath();
      ctx.moveTo(x, this.height - 30);
      ctx.lineTo(x, this.height - 25);
      ctx.stroke();
      ctx.fillText(String(λ), x - 10, this.height - 12);
    }

    // Dibujar curvas L, M, S (aproximadas con "Gaussians")
    this.drawCurve(ctx, '#60a5fa', (λ) => this.gauss(λ, 445, 30)); // S
    this.drawCurve(ctx, '#22c55e', (λ) => this.gauss(λ, 535, 40)); // M
    this.drawCurve(ctx, '#f97316', (λ) => this.gauss(λ, 570, 50)); // L

    // Leyenda
    const legendY = 30;
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(this.width - 150, legendY, 12, 3);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('S (azul)', this.width - 130, legendY + 4);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(this.width - 150, legendY + 16, 12, 3);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('M (verde)', this.width - 130, legendY + 20);

    ctx.fillStyle = '#f97316';
    ctx.fillRect(this.width - 150, legendY + 32, 12, 3);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('L (rojo)', this.width - 130, legendY + 36);
  }

  private xFromLambda(lambda: number): number {
    // λ ∈ [400,700] → x ∈ [40, width - 20]
    const minλ = 400;
    const maxλ = 700;
    const minX = 40;
    const maxX = this.width - 20;
    return minX + ((lambda - minλ) / (maxλ - minλ)) * (maxX - minX);
  }

  private yFromSensitivity(value: number): number {
    // valor ∈ [0,1] → y ∈ [20, height - 30]
    const minY = 20;
    const maxY = this.height - 30;
    return maxY - value * (maxY - minY);
  }

  private gauss(λ: number, μ: number, σ: number): number {
    const exponent = -((λ - μ) ** 2) / (2 * σ ** 2);
    return Math.exp(exponent);
  }

  private drawCurve(
    ctx: CanvasRenderingContext2D,
    strokeStyle: string,
    fn: (lambda: number) => number
  ): void {
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;

    let first = true;
    for (let λ = 400; λ <= 700; λ += 2) {
      const value = fn(λ);
      const x = this.xFromLambda(λ);
      const y = this.yFromSensitivity(value);

      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
}
