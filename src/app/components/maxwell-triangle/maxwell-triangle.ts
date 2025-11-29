import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-maxwell-triangle',
  standalone: true,
  templateUrl: './maxwell-triangle.html',
  styleUrls: ['./maxwell-triangle.scss']
})
export class MaxwellTriangle implements AfterViewInit {
  @ViewChild('colorCanvas', { static: true })
  colorCanvas!: ElementRef<HTMLCanvasElement>;

  private width = 420;
  private height = 420;

  ngAfterViewInit(): void {
    this.drawTriangle();
  }

  private drawTriangle(): void {
    const canvas = this.colorCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = this.width;
    canvas.height = this.height;

    // Fondo oscuro suave
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, this.width, this.height);

    const margin = 50;

    // Vértices del triángulo (equilátero aproximadamente)
    const A = { x: this.width / 2, y: margin };                 // vértice superior (Rojo)
    const B = { x: margin, y: this.height - margin };           // inferior izquierda (Verde)
    const C = { x: this.width - margin, y: this.height - margin }; // inferior derecha (Azul)

    // Colores de los vértices en RGB
    const colorA = { r: 255, g: 0, b: 0 };   // Rojo
    const colorB = { r: 0,  g: 255, b: 0 };  // Verde
    const colorC = { r: 0,  g: 0,   b: 255 }; // Azul

    // Rellenamos usando interpolación barycéntrica
    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const bary = this.barycentricCoords(x, y, A, B, C);

        if (bary && bary.u >= 0 && bary.v >= 0 && bary.w >= 0) {
          // Mezcla de colores según las coordenadas barycéntricas
          const r =
            bary.u * colorA.r +
            bary.v * colorB.r +
            bary.w * colorC.r;
          const g =
            bary.u * colorA.g +
            bary.v * colorB.g +
            bary.w * colorC.g;
          const b =
            bary.u * colorA.b +
            bary.v * colorB.b +
            bary.w * colorC.b;

          const index = (y * this.width + x) * 4;
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255; // opacidad
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Dibujamos borde del triángulo
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.stroke();

    // Etiquetas de los vértices
    ctx.font = '14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#f9fafb';
    ctx.textAlign = 'center';

    ctx.fillText('R', A.x, A.y - 10);          // Rojo
    ctx.fillText('G', B.x - 10, B.y + 18);     // Verde
    ctx.fillText('B', C.x + 10, C.y + 18);     // Azul
  }

  /**
   * Coordenadas barycéntricas de un punto (px, py)
   * respecto al triángulo ABC.
   * Retorna u, v, w tales que u+v+w = 1.
   */
  private barycentricCoords(
    px: number,
    py: number,
    A: { x: number; y: number },
    B: { x: number; y: number },
    C: { x: number; y: number }
  ): { u: number; v: number; w: number } | null {
    const x = px;
    const y = py;

    const x1 = A.x, y1 = A.y;
    const x2 = B.x, y2 = B.y;
    const x3 = C.x, y3 = C.y;

    const denom =
      (y2 - y3) * (x1 - x3) +
      (x3 - x2) * (y1 - y3);

    if (denom === 0) {
      return null;
    }

    const u =
      ((y2 - y3) * (x - x3) +
        (x3 - x2) * (y - y3)) / denom;
    const v =
      ((y3 - y1) * (x - x3) +
        (x1 - x3) * (y - y3)) / denom;
    const w = 1 - u - v;

    return { u, v, w };
  }
}
