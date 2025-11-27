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
  selectedCircles: ColorCircle[] = []; // Ahora se seleccionan DOS círculos
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

      // Saturación: 100% en la BASE (abajo, rowIndex=0) → 0% en la CIMA (arriba, rowIndex=3)
      const saturation = 100 - (rowIndex * 33); // 100, 67, 34, 1
      // Lightness: 50% en la BASE (colores puros) → 90% en la CIMA (blanco)
      const lightness = 50 + (rowIndex * 13); // 50, 63, 76, 89

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
    console.log('=== CLICK en círculo ===');
    console.log('Círculo clickeado: Fila', circle.rowIndex, 'Columna', circle.colIndex);
    console.log('Seleccionados antes:', this.selectedCircles.length);

    // Si ya está seleccionado, deseleccionarlo
    const index = this.selectedCircles.findIndex(c => c === circle);
    if (index >= 0) {
      console.log('Deseleccionando círculo');
      this.selectedCircles.splice(index, 1);
      console.log('Seleccionados después:', this.selectedCircles.length);
      return;
    }

    // Si ya hay 2 seleccionados, reiniciar
    if (this.selectedCircles.length >= 2) {
      console.log('Ya hay 2 seleccionados, reiniciando con este círculo');
      this.selectedCircles = [circle];
      console.log('Seleccionados después:', this.selectedCircles.length);
      return;
    }

    // Agregar a la selección
    this.selectedCircles.push(circle);
    console.log('Agregado a selección. Total seleccionados:', this.selectedCircles.length);

    // Si ahora hay 2, verificar que sean adyacentes en la misma fila
    if (this.selectedCircles.length === 2) {
      const [c1, c2] = this.selectedCircles;
      console.log('Dos círculos seleccionados:');
      console.log('  C1: Fila', c1.rowIndex, 'Col', c1.colIndex);
      console.log('  C2: Fila', c2.rowIndex, 'Col', c2.colIndex);

      // Deben estar en la misma fila
      if (c1.rowIndex !== c2.rowIndex) {
        console.log('ERROR: No están en la misma fila. Reiniciando.');
        this.selectedCircles = [circle];
        return;
      }

      // Deben ser adyacentes
      const diff = Math.abs(c1.colIndex - c2.colIndex);
      console.log('Diferencia de columnas:', diff);
      if (diff !== 1) {
        console.log('ERROR: No son adyacentes. Reiniciando.');
        this.selectedCircles = [circle];
      } else {
        console.log('✓ Son adyacentes y están en la misma fila!');
        console.log('El círculo resultante debería estar en fila', c1.rowIndex + 1, 'columna', Math.min(c1.colIndex, c2.colIndex));
      }
    }
  }

  isCircleHighlighted(circle: ColorCircle): boolean {
    // Si es uno de los círculos seleccionados
    if (this.selectedCircles.includes(circle)) {
      console.log('Círculo seleccionado:', circle.rowIndex, circle.colIndex);
      return true;
    }

    // Si es el círculo resultante de los dos seleccionados
    if (this.selectedCircles.length === 2) {
      const [c1, c2] = this.selectedCircles;
      console.log('Verificando resultante para:', c1.rowIndex, c1.colIndex, 'y', c2.rowIndex, c2.colIndex);
      console.log('Círculo actual:', circle.rowIndex, circle.colIndex);

      // Los seleccionados deben estar en la misma fila
      if (c1.rowIndex !== c2.rowIndex) {
        console.log('No están en la misma fila');
        return false;
      }

      // El resultante está en la fila de arriba
      if (circle.rowIndex !== c1.rowIndex + 1) {
        console.log('No es la fila de arriba. Esperado:', c1.rowIndex + 1, 'Actual:', circle.rowIndex);
        return false;
      }

      // El índice del resultante corresponde al menor de los dos seleccionados
      const minCol = Math.min(c1.colIndex, c2.colIndex);
      const isResult = circle.colIndex === minCol;
      console.log('¿Es resultante? minCol:', minCol, 'circle.colIndex:', circle.colIndex, 'resultado:', isResult);
      return isResult;
    }

    return false;
  }

  isConnectionHighlighted(connection: Connection): boolean {
    if (this.selectedCircles.length !== 2) return false;

    const [c1, c2] = this.selectedCircles;

    // La conexión debe partir de uno de los seleccionados
    const fromSelected = this.selectedCircles.includes(connection.from);
    if (!fromSelected) return false;

    // Y debe llegar al círculo resultante
    const minCol = Math.min(c1.colIndex, c2.colIndex);
    const resultRow = c1.rowIndex + 1;

    return connection.to.rowIndex === resultRow &&
           connection.to.colIndex === minCol;
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
    this.selectedCircles = [];
  }
}
