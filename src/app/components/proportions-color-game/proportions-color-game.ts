import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ColorProportion {
  color: string;
  colorName: string;
  percentage: number;
}

interface Level {
  number: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-proportions-color-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proportions-color-game.html',
  styleUrl: './proportions-color-game.css'
})
export class ProportionsColorGame {
  // Niveles del juego
  protected currentLevel = signal<number>(1);
  protected levels: Level[] = [
    { number: 1, name: 'Básico', description: 'Identifica la proporción correcta' },
    { number: 2, name: 'Intermedio', description: 'Ajusta las proporciones con precisión' },
    { number: 3, name: 'Avanzado', description: 'Domina proporciones complejas' }
  ];

  // Nivel 1: Selección múltiple
  protected level1Target: ColorProportion[] = [];
  protected level1Options: string[] = [];
  protected level1SelectedAnswer = '';
  protected level1Feedback = '';
  protected level1IsCorrect = false;

  // Nivel 2: Sliders
  protected level2Target: ColorProportion[] = [];
  protected level2PlayerProportions: { [key: string]: number } = {};
  protected level2Feedback = '';
  protected level2Error = 100;

  // Nivel 3: Múltiples colores
  protected level3Target: ColorProportion[] = [];
  protected level3PlayerProportions: { [key: string]: number } = {};
  protected level3Feedback = '';
  protected level3Error = 100;

  protected showCelebration = false;

  constructor() {
    this.initializeLevel1();
  }

  // ========== NIVEL 1: SELECCIÓN MÚLTIPLE ==========
  protected initializeLevel1(): void {
    const scenarios = [
      [
        { color: '#FF6B6B', colorName: 'Rojo', percentage: 50 },
        { color: '#4ECDC4', colorName: 'Cian', percentage: 50 }
      ],
      [
        { color: '#FFE66D', colorName: 'Amarillo', percentage: 60 },
        { color: '#A8E6CF', colorName: 'Verde', percentage: 40 }
      ],
      [
        { color: '#FF6B9D', colorName: 'Rosa', percentage: 70 },
        { color: '#C7CEEA', colorName: 'Lavanda', percentage: 30 }
      ]
    ];

    this.level1Target = scenarios[Math.floor(Math.random() * scenarios.length)];

    // Generar opciones de respuesta
    const correct = this.formatProportions(this.level1Target);
    const options = [correct];

    // Generar respuestas incorrectas
    while (options.length < 3) {
      const wrong = this.generateWrongAnswer(this.level1Target);
      if (!options.includes(wrong)) {
        options.push(wrong);
      }
    }

    // Mezclar opciones
    this.level1Options = this.shuffleArray(options);
    this.level1SelectedAnswer = '';
    this.level1Feedback = '';
    this.level1IsCorrect = false;
  }

  protected formatProportions(proportions: ColorProportion[]): string {
    return proportions.map(p => `${p.percentage}% ${p.colorName}`).join(', ');
  }

  protected generateWrongAnswer(target: ColorProportion[]): string {
    const modified = target.map(p => ({
      ...p,
      percentage: p.percentage + (Math.random() > 0.5 ? 10 : -10)
    }));

    // Normalizar para que sume 100
    const sum = modified.reduce((acc, p) => acc + p.percentage, 0);
    modified.forEach(p => p.percentage = Math.round((p.percentage / sum) * 100));

    return this.formatProportions(modified);
  }

  protected checkLevel1Answer(): void {
    const correct = this.formatProportions(this.level1Target);

    if (this.level1SelectedAnswer === correct) {
      this.level1Feedback = '¡Correcto! Has identificado las proporciones.';
      this.level1IsCorrect = true;
      this.showCelebration = true;
      setTimeout(() => this.showCelebration = false, 2000);
    } else {
      this.level1Feedback = 'Incorrecto. Observa mejor las proporciones del círculo.';
      this.level1IsCorrect = false;
    }
  }

  protected nextFromLevel1(): void {
    this.currentLevel.set(2);
    this.initializeLevel2();
  }

  // ========== NIVEL 2: SLIDERS ==========
  protected initializeLevel2(): void {
    const scenarios = [
      [
        { color: '#FF6B6B', colorName: 'Rojo', percentage: 40 },
        { color: '#4ECDC4', colorName: 'Cian', percentage: 60 }
      ],
      [
        { color: '#FFE66D', colorName: 'Amarillo', percentage: 35 },
        { color: '#95E1D3', colorName: 'Verde Agua', percentage: 65 }
      ],
      [
        { color: '#F38181', colorName: 'Coral', percentage: 55 },
        { color: '#AA96DA', colorName: 'Morado', percentage: 45 }
      ]
    ];

    this.level2Target = scenarios[Math.floor(Math.random() * scenarios.length)];
    this.level2PlayerProportions = {};

    this.level2Target.forEach(p => {
      this.level2PlayerProportions[p.colorName] = 50;
    });

    this.updateLevel2();
  }

  protected updateLevel2(): void {
    // Normalizar para que sume 100
    const keys = Object.keys(this.level2PlayerProportions);
    const total = keys.reduce((sum, key) => sum + this.level2PlayerProportions[key], 0);

    if (total === 0) {
      this.level2Error = 100;
      this.level2Feedback = 'Ajusta los sliders para crear proporciones.';
      return;
    }

    // Calcular error
    let error = 0;
    this.level2Target.forEach(target => {
      const playerValue = this.level2PlayerProportions[target.colorName] || 0;
      const playerPercentage = (playerValue / total) * 100;
      error += Math.abs(playerPercentage - target.percentage);
    });

    this.level2Error = error;

    if (error < 5) {
      this.level2Feedback = '¡Excelente! Has ajustado las proporciones correctamente.';
      this.showCelebration = true;
      setTimeout(() => this.showCelebration = false, 2000);
    } else if (error < 15) {
      this.level2Feedback = '¡Muy cerca! Ajusta un poco más.';
    } else {
      this.level2Feedback = 'Sigue ajustando los sliders para igualar las proporciones.';
    }
  }

  protected getLevel2PlayerPercentages(): ColorProportion[] {
    const total = Object.values(this.level2PlayerProportions).reduce((a, b) => a + b, 0);

    if (total === 0) {
      return this.level2Target.map(t => ({ ...t, percentage: 0 }));
    }

    return this.level2Target.map(target => ({
      color: target.color,
      colorName: target.colorName,
      percentage: Math.round((this.level2PlayerProportions[target.colorName] / total) * 100)
    }));
  }

  protected nextFromLevel2(): void {
    if (this.level2Error < 5) {
      this.currentLevel.set(3);
      this.initializeLevel3();
    }
  }

  // ========== NIVEL 3: AVANZADO ==========
  protected initializeLevel3(): void {
    const scenarios = [
      [
        { color: '#FF6B6B', colorName: 'Rojo', percentage: 30 },
        { color: '#4ECDC4', colorName: 'Cian', percentage: 25 },
        { color: '#FFE66D', colorName: 'Amarillo', percentage: 45 }
      ],
      [
        { color: '#95E1D3', colorName: 'Verde', percentage: 40 },
        { color: '#AA96DA', colorName: 'Morado', percentage: 35 },
        { color: '#FCBAD3', colorName: 'Rosa', percentage: 25 }
      ],
      [
        { color: '#F38181', colorName: 'Coral', percentage: 20 },
        { color: '#AA96DA', colorName: 'Morado', percentage: 50 },
        { color: '#FFFFD2', colorName: 'Crema', percentage: 30 }
      ]
    ];

    this.level3Target = scenarios[Math.floor(Math.random() * scenarios.length)];
    this.level3PlayerProportions = {};

    this.level3Target.forEach(p => {
      this.level3PlayerProportions[p.colorName] = 33;
    });

    this.updateLevel3();
  }

  protected updateLevel3(): void {
    // Normalizar para que sume 100
    const keys = Object.keys(this.level3PlayerProportions);
    const total = keys.reduce((sum, key) => sum + this.level3PlayerProportions[key], 0);

    if (total === 0) {
      this.level3Error = 100;
      this.level3Feedback = 'Ajusta los sliders para crear proporciones.';
      return;
    }

    // Calcular error
    let error = 0;
    this.level3Target.forEach(target => {
      const playerValue = this.level3PlayerProportions[target.colorName] || 0;
      const playerPercentage = (playerValue / total) * 100;
      error += Math.abs(playerPercentage - target.percentage);
    });

    this.level3Error = error;

    if (error < 8) {
      this.level3Feedback = '¡Perfecto! Has dominado las proporciones complejas.';
      this.showCelebration = true;
      setTimeout(() => this.showCelebration = false, 2000);
    } else if (error < 20) {
      this.level3Feedback = '¡Bien! Estás cerca, afina un poco más.';
    } else {
      this.level3Feedback = 'Observa las proporciones objetivo y ajusta los sliders.';
    }
  }

  protected getLevel3PlayerPercentages(): ColorProportion[] {
    const total = Object.values(this.level3PlayerProportions).reduce((a, b) => a + b, 0);

    if (total === 0) {
      return this.level3Target.map(t => ({ ...t, percentage: 0 }));
    }

    return this.level3Target.map(target => ({
      color: target.color,
      colorName: target.colorName,
      percentage: Math.round((this.level3PlayerProportions[target.colorName] / total) * 100)
    }));
  }

  // ========== UTILIDADES ==========
  protected shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  protected resetLevel(): void {
    if (this.currentLevel() === 1) {
      this.initializeLevel1();
    } else if (this.currentLevel() === 2) {
      this.initializeLevel2();
    } else if (this.currentLevel() === 3) {
      this.initializeLevel3();
    }
  }

  protected goToLevel(level: number): void {
    this.currentLevel.set(level);
    this.resetLevel();
  }

  protected getPieChartStyle(): string {
    let angle = 0;
    const gradientParts: string[] = [];

    this.level1Target.forEach(segment => {
      const segmentAngle = segment.percentage * 3.6;
      gradientParts.push(`${segment.color} ${angle}deg ${angle + segmentAngle}deg`);
      angle += segmentAngle;
    });

    return `conic-gradient(${gradientParts.join(', ')})`;
  }
}
