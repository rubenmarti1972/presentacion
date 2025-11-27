import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ColorCircle {
  cx: number;
  cy: number;
  color: string;
  rowIndex: number;
  colIndex: number;
  hue: number;
  saturation: number;
  lightness: number;
}

interface Connection {
  from: ColorCircle;
  to: ColorCircle;
}

@Component({
  selector: 'app-color-triangle',
  imports: [CommonModule],
  templateUrl: './color-triangle.html',
  styleUrl: './color-triangle.css'
})
export class ColorTriangle implements OnInit, OnDestroy {
  circles: ColorCircle[][] = []; // Matriz de círculos por fila
  connections: Connection[] = [];
  selectedCircle: ColorCircle | null = null;
  animationId: number | null = null;

  // Configuración
  circleRadius = 30;
  spacing = 90;
  svgWidth = 900;
  svgHeight = 600;

  // Colores base (7 tonos del espectro)
  baseHues = [0, 60, 120, 180, 240, 300, 330]; // Rojo, Amarillo, Verde, Cian, Azul, Magenta, Naranja

  ngOnInit() {
    this.generatePyramid();
    this.generateConnections();
  }

  ngOnDestroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }

  generatePyramid() {
    const rows = [7, 6, 5, 4]; // Base a cima (índices 0, 1, 2, 3)
    const centerX = this.svgWidth / 2;
    const startY = 450;

    // Generar matriz de colores base por fila
    const hueMatrix: number[][] = [];

    // Fila 0 (base): 7 colores puros
    hueMatrix[0] = this.baseHues;

    // Generar filas superiores interpolando los tonos
    for (let row = 1; row < rows.length; row++) {
      hueMatrix[row] = [];
      const prevRow = hueMatrix[row - 1];
      const numCircles = rows[row];

      for (let i = 0; i < numCircles; i++) {
        // Cada círculo es el promedio de dos círculos de abajo
        const hue1 = prevRow[i];
        const hue2 = prevRow[i + 1];
        // Promedio de tonos considerando el ciclo de 360°
        let avgHue = (hue1 + hue2) / 2;
        hueMatrix[row].push(avgHue);
      }
    }

    // Crear círculos con posiciones y colores
    this.circles = [];
    rows.forEach((circleCount, rowIndex) => {
      const y = startY - (rowIndex * this.spacing);
      const rowCircles: ColorCircle[] = [];

      // Saturación: 100% en la base, disminuye hacia arriba
      const saturation = 100 - (rowIndex * 25); // 100, 75, 50, 25
      const lightness = 50 + (rowIndex * 10); // 50, 60, 70, 80

      for (let i = 0; i < circleCount; i++) {
        const totalWidth = (circleCount - 1) * this.spacing;
        const x = centerX - totalWidth / 2 + (i * this.spacing);
        const hue = hueMatrix[rowIndex][i];

        rowCircles.push({
          cx: x,
          cy: y,
          color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
          rowIndex: rowIndex,
          colIndex: i,
          hue: hue,
          saturation: saturation,
          lightness: lightness
        });
      }

      this.circles.push(rowCircles);
    });
  }

  generateConnections() {
    this.connections = [];

    // Conectar cada círculo (excepto la base) con los dos círculos de abajo que lo forman
    for (let row = 1; row < this.circles.length; row++) {
      const currentRow = this.circles[row];      // Fila actual (superior)
      const belowRow = this.circles[row - 1];    // Fila de abajo

      currentRow.forEach((circle, i) => {
        // Cada círculo se conecta con los círculos i e i+1 de la fila de abajo
        this.connections.push({
          from: belowRow[i],
          to: circle
        });
        this.connections.push({
          from: belowRow[i + 1],
          to: circle
        });
      });
    }
  }

  onCircleClick(circle: ColorCircle) {
    this.selectedCircle = circle;
  }

  isCircleHighlighted(circle: ColorCircle): boolean {
    if (!this.selectedCircle) return false;

    // Si es el círculo seleccionado
    if (circle === this.selectedCircle) return true;

    // Si es uno de los círculos que forman el seleccionado
    if (this.selectedCircle.rowIndex > 0) {
      const belowRow = this.circles[this.selectedCircle.rowIndex - 1];
      if (!belowRow) return false;

      return circle === belowRow[this.selectedCircle.colIndex] ||
             circle === belowRow[this.selectedCircle.colIndex + 1];
    }

    return false;
  }

  isConnectionHighlighted(connection: Connection): boolean {
    if (!this.selectedCircle) return false;
    return connection.to === this.selectedCircle;
  }

  getCircleClass(circle: ColorCircle): string {
    const classes = ['color-circle'];
    if (this.isCircleHighlighted(circle)) {
      classes.push('highlighted');
    }
    return classes.join(' ');
  }

  getConnectionClass(connection: Connection): string {
    const classes = ['connection-line'];
    if (this.isConnectionHighlighted(connection)) {
      classes.push('highlighted');
    }
    return classes.join(' ');
  }

  clearSelection() {
    this.selectedCircle = null;
  }
}
