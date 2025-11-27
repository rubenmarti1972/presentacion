import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface HslColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

@Component({
  selector: 'app-color-mixer-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './color-mixer-game.html',
  styleUrl: './color-mixer-game.css'
})
export class ColorMixerGame {
  // color objetivo (se inicializa en el constructor)
  targetColor: HslColor;

  // sliders del jugador
  redAmount = 5;
  yellowAmount = 5;
  blueAmount = 0;
  whiteMix = 0; // 0 a 100 (%)

  // color actual del jugador
  playerColor: HslColor = { h: 0, s: 0, l: 50 };

  // feedback
  error = 999;
  resultMessage = '';
  resultClass = '';

  constructor() {
    this.targetColor = this.randomTargetColor();
    this.updatePlayerColor();
  }

  /** Genera un color objetivo semi-controlado (no cualquier cosa loca) */
  randomTargetColor(): HslColor {
    // tonos basados en mezcla de primarios: 0 (rojo), 60 (amarillo), 240 (azul)
    const primaries = [0, 60, 240];
    const a = this.randInt(0, 10);
    const b = this.randInt(0, 10);
    const c = this.randInt(0, 10);

    const sum = a + b + c || 1;
    const wR = a / sum;
    const wY = b / sum;
    const wB = c / sum;

    const h = wR * primaries[0] + wY * primaries[1] + wB * primaries[2];

    const s = this.randInt(50, 100);   // saturación de 50–100%
    const l = this.randInt(40, 60);    // luminosidad 40–60%

    return { h, s, l };
  }

  randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Actualiza el color del jugador a partir de los sliders */
  updatePlayerColor(): void {
    const r = this.redAmount;
    const y = this.yellowAmount;
    const b = this.blueAmount;

    const sum = r + y + b;

    if (sum === 0) {
      this.playerColor = { h: 0, s: 0, l: 50 };
      this.updateError();
      return;
    }

    const wR = r / sum;
    const wY = y / sum;
    const wB = b / sum;

    const hueRed = 0;
    const hueYellow = 60;
    const hueBlue = 240;

    const h = wR * hueRed + wY * hueYellow + wB * hueBlue;

    const baseS = 100;
    const s = baseS * (1 - this.whiteMix / 100); // la mezcla con blanco baja la saturación

    const l = 50 + (this.whiteMix / 100) * 15; // más blanco, más luminoso (hasta ~65)

    this.playerColor = { h, s, l };
    this.updateError();
  }

  /** Calcula una "distancia" entre el color del jugador y el objetivo */
  updateError(): void {
    const dh = this.normalizeHueDiff(this.playerColor.h - this.targetColor.h);
    const ds = this.playerColor.s - this.targetColor.s;
    const dl = this.playerColor.l - this.targetColor.l;

    this.error = Math.sqrt(dh * dh + ds * ds + dl * dl);

    if (this.error < 8) {
      this.resultMessage = '¡Perfecto! Has igualado el color casi exactamente.';
      this.resultClass = 'result-ok';
    } else if (this.error < 20) {
      this.resultMessage = '¡Muy bien! Estás bastante cerca, ajusta un poco más.';
      this.resultClass = 'result-close';
    } else {
      this.resultMessage = 'Aún hay diferencia notable, sigue jugando con las proporciones.';
      this.resultClass = 'result-bad';
    }
  }

  /** Normaliza diferencia de hue para que respete la circularidad (0-360) */
  normalizeHueDiff(dh: number): number {
    dh = ((dh + 180) % 360) - 180;
    return dh;
  }

  /** CSS */
  hslToCss(c: HslColor): string {
    return `hsl(${c.h}, ${c.s}%, ${c.l}%)`;
  }

  /** Nuevo reto */
  newTargetColor(): void {
    this.targetColor = this.randomTargetColor();
    this.updateError();
  }

  /** Reiniciar sliders */
  resetSliders(): void {
    this.redAmount = 5;
    this.yellowAmount = 5;
    this.blueAmount = 0;
    this.whiteMix = 0;
    this.updatePlayerColor();
  }
}
