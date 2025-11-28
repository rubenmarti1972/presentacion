import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface ColorBottle {
  id: string;
  name: string;
  color: string;
  rgb: { r: number; g: number; b: number };
  amount: number;
}

interface Mission {
  description: string;
  targetVolume: number;
  targetRatio: string;
  targetColor: string;
  targetRGB: { r: number; g: number; b: number };
  requiredBottles: { [key: string]: number };
  successMessage: string;
  hints: string[];
}

interface Order {
  name: string;
  description: string;
  volume: number;
  ratio: string;
  targetColor: string;
  targetRGB: { r: number; g: number; b: number };
  requiredMix: { [key: string]: number };
  mix: { [key: string]: number };
  completed: boolean;
}

@Component({
  selector: 'app-color-lab-challenge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './color-lab-challenge.html',
  styleUrl: './color-lab-challenge.css'
})
export class ColorLabChallenge {
  // Hacer Math disponible en el template
  protected readonly Math = Math;

  constructor() {
    this.applyUniformTargets();
  }

  private pouringStartTimeout: ReturnType<typeof setTimeout> | null = null;
  private pouringEndTimeout: ReturnType<typeof setTimeout> | null = null;
  protected pouringBottle: ColorBottle | null = null;
  protected pouringActive = false;

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r1 = 0, g1 = 0, b1 = 0;

    if (h >= 0 && h < 60) {
      r1 = c; g1 = x; b1 = 0;
    } else if (h >= 60 && h < 120) {
      r1 = x; g1 = c; b1 = 0;
    } else if (h >= 120 && h < 180) {
      r1 = 0; g1 = c; b1 = x;
    } else if (h >= 180 && h < 240) {
      r1 = 0; g1 = x; b1 = c;
    } else if (h >= 240 && h < 300) {
      r1 = x; g1 = 0; b1 = c;
    } else {
      r1 = c; g1 = 0; b1 = x;
    }

    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  private mixPigments(amounts: { red?: number; yellow?: number; blue?: number; white?: number }): { r: number; g: number; b: number } {
    const red = Math.max(0, amounts.red || 0);
    const yellow = Math.max(0, amounts.yellow || 0);
    const blue = Math.max(0, amounts.blue || 0);
    const white = Math.max(0, amounts.white || 0);

    const pigmentTotal = red + yellow + blue;
    const totalWithWhite = pigmentTotal + white;

    if (pigmentTotal === 0) {
      const neutral = white > 0 ? 255 : 240;
      return { r: neutral, g: neutral, b: neutral };
    }

    // RYB wheel angles to get artist-friendly hues
    const degToRad = Math.PI / 180;
    const redAngle = 0 * degToRad;
    const yellowAngle = 90 * degToRad;
    const blueAngle = 220 * degToRad;

    const x = red * Math.cos(redAngle) + yellow * Math.cos(yellowAngle) + blue * Math.cos(blueAngle);
    const y = red * Math.sin(redAngle) + yellow * Math.sin(yellowAngle) + blue * Math.sin(blueAngle);

    let hue = (Math.atan2(y, x) * 180) / Math.PI;
    if (hue < 0) hue += 360;

    const whiteRatio = totalWithWhite > 0 ? white / totalWithWhite : 0;
    const pigmentRatio = 1 - whiteRatio;

    const saturation = Math.min(1, Math.max(0, 0.92 - 0.42 * whiteRatio));
    const lightness = Math.min(1, Math.max(0, 0.47 + 0.38 * whiteRatio));

    return this.hslToRgb(hue, saturation * pigmentRatio + 0.25 * whiteRatio, lightness);
  }

  private mixPigmentsToCss(amounts: { red?: number; yellow?: number; blue?: number; white?: number }): string {
    const { r, g, b } = this.mixPigments(amounts);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private applyUniformTargets(): void {
    const applyTargets = (target: { targetRGB: { r: number; g: number; b: number }; targetColor: string }, amounts: { red?: number; yellow?: number; blue?: number; white?: number }) => {
      const rgb = this.mixPigments(amounts);
      target.targetRGB = rgb;
      target.targetColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    };

    this.inicialMissions.forEach(mission => {
      applyTargets(mission, mission.requiredBottles);
    });

    this.intermedioOrders.forEach(order => {
      applyTargets(order, order.requiredBottles);
    });

    this.avanzadoOrders.forEach(order => {
      applyTargets(order, order.requiredMix);
    });
  }

  // Nivel actual
  protected currentLevel = signal<'inicial' | 'intermedio' | 'avanzado'>('inicial');

  // ========== NIVEL INICIAL ==========
  protected inicialMissions: Mission[] = [
    {
      description: '¡Crea color NARANJA! Mezcla rojo y amarillo en partes iguales.',
      targetVolume: 200,
      targetRatio: '1:1 (Rojo:Amarillo)',
      targetColor: 'rgb(255, 165, 0)',
      targetRGB: { r: 255, g: 165, b: 0 },
      requiredBottles: { red: 100, yellow: 100 },
      successMessage: '¡Excelente! El rojo y el amarillo hacen naranja.',
      hints: ['Necesitas la misma cantidad de rojo y amarillo', 'Prueba con 100ml de cada color']
    },
    {
      description: 'Crea MORADO usando el DOBLE de azul que de rojo.',
      targetVolume: 300,
      targetRatio: '1:2 (Rojo:Azul)',
      targetColor: 'rgb(138, 43, 226)',
      targetRGB: { r: 138, g: 43, b: 226 },
      requiredBottles: { red: 100, blue: 200 },
      successMessage: '¡Genial! 1 parte de rojo + 2 partes de azul = morado',
      hints: ['Si usas 100ml de rojo, ¿cuántos ml de azul necesitas?', 'El doble de 100ml es 200ml']
    },
    {
      description: 'Crea VERDE usando partes iguales de amarillo y azul. Total: 300ml',
      targetVolume: 300,
      targetRatio: '1:1 (Amarillo:Azul)',
      targetColor: 'rgb(50, 205, 50)',
      targetRGB: { r: 50, g: 205, b: 50 },
      requiredBottles: { yellow: 150, blue: 150 },
      successMessage: '¡Perfecto! Amarillo + azul = verde brillante',
      hints: ['Necesitas 300ml en total en partes iguales', '300ml ÷ 2 colores = 150ml de cada uno']
    }
  ];

  protected inicialCurrentMission = 0;
  protected inicialSelectedBottles: ColorBottle[] = [];
  protected inicialAvailableBottles: ColorBottle[] = [
    { id: 'red-100', name: 'Rojo', color: 'rgb(255, 0, 0)', rgb: { r: 255, g: 0, b: 0 }, amount: 100 },
    { id: 'blue-100', name: 'Azul', color: 'rgb(0, 0, 255)', rgb: { r: 0, g: 0, b: 255 }, amount: 100 },
    { id: 'yellow-100', name: 'Amarillo', color: 'rgb(255, 255, 0)', rgb: { r: 255, g: 255, b: 0 }, amount: 100 },
    { id: 'red-150', name: 'Rojo', color: 'rgb(255, 0, 0)', rgb: { r: 255, g: 0, b: 0 }, amount: 150 },
    { id: 'blue-150', name: 'Azul', color: 'rgb(0, 0, 255)', rgb: { r: 0, g: 0, b: 255 }, amount: 150 },
    { id: 'blue-200', name: 'Azul', color: 'rgb(0, 0, 255)', rgb: { r: 0, g: 0, b: 255 }, amount: 200 },
    { id: 'yellow-150', name: 'Amarillo', color: 'rgb(255, 255, 0)', rgb: { r: 255, g: 255, b: 0 }, amount: 150 }
  ];
  protected inicialShowSuccess = false;
  protected inicialHintLevel = 0;

  // ========== NIVEL SECUNDARIA ==========
  protected intermedioOrders: Mission[] = [
    {
      description: 'Crear pintura MORADA para una habitación',
      targetVolume: 300,
      targetRatio: '2:3 (Rojo:Azul)',
      targetColor: 'rgb(138, 43, 226)',
      targetRGB: { r: 138, g: 43, b: 226 },
      requiredBottles: { red: 120, blue: 180 },
      successMessage: '¡Exacto! 120ml de rojo + 180ml de azul = 300ml de morado perfecto.',
      hints: [
        'La proporción 2:3 significa que por cada 2 partes de rojo, necesitas 3 partes de azul.',
        'Total de partes: 2+3=5. Cada parte: 300ml÷5 = 60ml.',
        'Entonces: 2×60ml = 120ml rojo, y 3×60ml = 180ml azul.'
      ]
    },
    {
      description: 'Mezcla VERDE LIMA para diseño gráfico',
      targetVolume: 500,
      targetRatio: '3:2 (Amarillo:Azul)',
      targetColor: 'rgb(50, 205, 50)',
      targetRGB: { r: 50, g: 205, b: 50 },
      requiredBottles: { yellow: 300, blue: 200 },
      successMessage: '¡Perfecto! 300ml amarillo + 200ml azul = verde lima brillante.',
      hints: [
        'Proporción 3:2 significa 3 partes amarillo por cada 2 de azul.',
        'Total de partes: 3+2 = 5. Cada parte: 500ml÷5 = 100ml.',
        'Amarillo: 3×100ml = 300ml. Azul: 2×100ml = 200ml.'
      ]
    },
    {
      description: 'NARANJA BRILLANTE para señalización',
      targetVolume: 400,
      targetRatio: '5:3 (Rojo:Amarillo)',
      targetColor: 'rgb(255, 140, 0)',
      targetRGB: { r: 255, g: 140, b: 0 },
      requiredBottles: { red: 250, yellow: 150 },
      successMessage: '¡Excelente cálculo! Esa proporción no era fácil.',
      hints: [
        'Proporción 5:3 con 400ml total.',
        'Partes totales: 5+3 = 8. Cada parte: 400ml÷8 = 50ml.',
        'Rojo: 5×50ml = 250ml. Amarillo: 3×50ml = 150ml.'
      ]
    }
  ];

  protected intermedioCurrentOrder = 0;
  protected intermedioMixAmounts: { [key: string]: number } = { red: 0, blue: 0, yellow: 0, white: 0 };
  protected intermedioShowSuccess = false;
  protected intermedioShowValidation = false;
  protected intermedioValidationMessage = '';
  protected intermedioValidationSuccess = false;
  protected intermedioHintIndex = 0;

  // ========== NIVEL UNIVERSITARIO ==========
  protected avanzadoInventory: { [key: string]: number } = {
    red: 500,
    blue: 400,
    yellow: 300,
    white: 200
  };

  protected avanzadoOrders: Order[] = [
    {
      name: 'Morado Corporativo',
      description: 'Para branding de empresa',
      volume: 300,
      ratio: '2:3 (R:B)',
      targetColor: 'rgb(138, 43, 226)',
      targetRGB: { r: 138, g: 43, b: 226 },
      requiredMix: { red: 120, blue: 180 },
      mix: {},
      completed: false
    },
    {
      name: 'Verde Naturaleza',
      description: 'Campaña ambiental',
      volume: 250,
      ratio: '1:1 (A:B)',
      targetColor: 'rgb(50, 205, 50)',
      targetRGB: { r: 50, g: 205, b: 50 },
      requiredMix: { yellow: 125, blue: 125 },
      mix: {},
      completed: false
    },
    {
      name: 'Naranja Intenso',
      description: 'Señalización',
      volume: 350,
      ratio: '3:2 (R:A)',
      targetColor: 'rgb(255, 140, 0)',
      targetRGB: { r: 255, g: 140, b: 0 },
      requiredMix: { red: 210, yellow: 140 },
      mix: {},
      completed: false
    }
  ];

  protected avanzadoActiveOrderIndex: number | null = null;
  protected avanzadoShowValidation = false;
  protected avanzadoValidationResult = { success: false, title: '', message: '' };
  protected avanzadoShowComplete = false;

  // ========== MÉTODOS NIVEL INFANTIL ==========
  protected getInicialMission(): Mission {
    return this.inicialMissions[this.inicialCurrentMission];
  }

  protected addBottleToMixer(bottle: ColorBottle): void {
    this.inicialSelectedBottles.push({ ...bottle });
    this.playPourAnimation(bottle);
  }

  protected clearInicialMixer(): void {
    this.inicialSelectedBottles = [];
  }

  private playPourAnimation(bottle: ColorBottle): void {
    this.pouringBottle = { ...bottle };
    this.pouringActive = false;

    if (this.pouringStartTimeout) {
      clearTimeout(this.pouringStartTimeout);
    }

    if (this.pouringEndTimeout) {
      clearTimeout(this.pouringEndTimeout);
    }

    this.pouringStartTimeout = setTimeout(() => {
      this.pouringActive = true;
    }, 10);

    this.pouringEndTimeout = setTimeout(() => {
      this.pouringActive = false;
      this.pouringBottle = null;
    }, 1400);
  }

  protected getInicialMixedColor(): string {
    if (this.inicialSelectedBottles.length === 0) return 'rgb(240, 240, 240)';

    const totals = this.inicialSelectedBottles.reduce(
      (acc, bottle) => {
        const key = bottle.name.toLowerCase();
        if (key.includes('rojo')) acc.red += bottle.amount;
        if (key.includes('amarillo')) acc.yellow += bottle.amount;
        if (key.includes('azul')) acc.blue += bottle.amount;
        if (key.includes('blanco')) acc.white += bottle.amount;
        return acc;
      },
      { red: 0, yellow: 0, blue: 0, white: 0 }
    );

    return this.mixPigmentsToCss(totals);
  }

  protected getInicialTotalVolume(): number {
    return this.inicialSelectedBottles.reduce((sum, b) => sum + b.amount, 0);
  }

  protected checkInicialSolution(): void {
    const mission = this.getInicialMission();
    const total = this.getInicialTotalVolume();

    // Verificar volumen
    if (total !== mission.targetVolume) {
      Swal.fire({
        icon: 'error',
        title: '¡Ups! Volumen incorrecto',
        html: `
          <p>El volumen total debe ser <strong>${mission.targetVolume}ml</strong></p>
          <p>Actualmente tienes <strong>${total}ml</strong></p>
          <p style="margin-top: 1rem;">Estás en la <strong>Misión ${this.inicialCurrentMission + 1}</strong> de ${this.inicialMissions.length}</p>
        `,
        confirmButtonText: '¡Intentaré de nuevo!',
        confirmButtonColor: '#4CAF50',
        showCancelButton: this.inicialCurrentMission > 0,
        cancelButtonText: '← Misión anterior',
        footer: '<small>💡 Puedes pedir una pista si lo necesitas</small>'
      }).then((result) => {
        if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
          this.prevInicialMission();
        }
      });
      return;
    }

    // Contar cantidades por color
    const amounts: { [key: string]: number } = {};
    this.inicialSelectedBottles.forEach(bottle => {
      const colorKey = bottle.name.toLowerCase().replace('í', 'i');
      amounts[colorKey] = (amounts[colorKey] || 0) + bottle.amount;
    });

    // Mapeo de nombres
    const nameMap: { [key: string]: string } = {
      'rojo': 'red',
      'azul': 'blue',
      'amarillo': 'yellow',
      'blanco': 'white'
    };

    // Verificar cantidades requeridas
    let isCorrect = true;
    for (const [key, required] of Object.entries(mission.requiredBottles)) {
      const spanishKey = Object.keys(nameMap).find(k => nameMap[k] === key) || key;
      const actual = amounts[spanishKey] || 0;
      if (Math.abs(actual - required) > 5) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      this.inicialShowSuccess = true;
    } else {
      Swal.fire({
        icon: 'warning',
        title: '¡Casi lo logras!',
        html: `
          <p>Las proporciones no son correctas 😔</p>
          <p>Revisa las cantidades de cada color</p>
          <p style="margin-top: 1rem;">Estás en la <strong>Misión ${this.inicialCurrentMission + 1}</strong> de ${this.inicialMissions.length}</p>
        `,
        confirmButtonText: '¡Seguir intentando!',
        confirmButtonColor: '#FF9800',
        showCancelButton: this.inicialCurrentMission > 0,
        cancelButtonText: '← Misión anterior',
        footer: '<small>💡 Puedes pedir una pista si lo necesitas</small>'
      }).then((result) => {
        if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
          this.prevInicialMission();
        }
      });
    }
  }

  protected nextInicialMission(): void {
    this.inicialShowSuccess = false;
    this.inicialCurrentMission++;
    this.clearInicialMixer();
    this.inicialHintLevel = 0;

    if (this.inicialCurrentMission >= this.inicialMissions.length) {
      Swal.fire({
        icon: 'success',
        title: '🎉 ¡Nivel Completado!',
        html: `
          <p>¡Felicidades! Has completado todas las misiones del nivel inicial</p>
          <p>🎨 Dominaste las mezclas de colores 🎨</p>
        `,
        confirmButtonText: 'Reiniciar nivel',
        confirmButtonColor: '#4CAF50',
        showCancelButton: true,
        cancelButtonText: 'Volver a la última misión'
      }).then((result) => {
        if (result.isConfirmed) {
          this.inicialCurrentMission = 0;
        } else {
          this.inicialCurrentMission = this.inicialMissions.length - 1;
        }
      });
    }
  }

  protected prevInicialMission(): void {
    if (this.inicialCurrentMission > 0) {
      this.inicialCurrentMission--;
      this.clearInicialMixer();
      this.inicialHintLevel = 0;
    }
  }

  protected showInicialHint(): void {
    const mission = this.getInicialMission();
    if (this.inicialHintLevel < mission.hints.length) {
      Swal.fire({
        icon: 'info',
        title: '💡 Pista',
        html: `
          <p style="font-size: 1.1rem;">${mission.hints[this.inicialHintLevel]}</p>
          <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
            Misión ${this.inicialCurrentMission + 1} de ${this.inicialMissions.length}
            • Pista ${this.inicialHintLevel + 1} de ${mission.hints.length}
          </p>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#FF9800'
      });
      this.inicialHintLevel++;
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'No hay más pistas',
        text: 'Ya has usado todas las pistas disponibles para esta misión',
        confirmButtonText: 'OK',
        confirmButtonColor: '#FF9800'
      });
    }
  }

  // ========== MÉTODOS NIVEL SECUNDARIA ==========
  protected getIntermedioOrder(): Mission {
    return this.intermedioOrders[this.intermedioCurrentOrder];
  }

  protected getIntermedioTotalVolume(): number {
    return Object.values(this.intermedioMixAmounts).reduce((sum, val) => sum + val, 0);
  }

  protected getIntermedioMixedColor(): string {
    const total = this.getIntermedioTotalVolume();
    if (total === 0) return 'rgb(240, 240, 240)';

    return this.mixPigmentsToCss(this.intermedioMixAmounts);
  }

  protected adjustIntermedioAmount(color: string, delta: number): void {
    this.intermedioMixAmounts[color] = Math.max(0, this.intermedioMixAmounts[color] + delta);
  }

  protected resetIntermedio(): void {
    this.intermedioMixAmounts = { red: 0, blue: 0, yellow: 0, white: 0 };
    this.intermedioShowValidation = false;
  }

  protected validateIntermedioOrder(): void {
    const order = this.getIntermedioOrder();
    const total = this.getIntermedioTotalVolume();
    const tolerance = 5;

    // Verificar volumen
    if (Math.abs(total - order.targetVolume) > tolerance) {
      this.intermedioValidationSuccess = false;
      this.intermedioValidationMessage = `El volumen total debe ser ${order.targetVolume}ml. Tienes ${total}ml.`;
      this.intermedioShowValidation = true;
      return;
    }

    // Verificar proporciones
    let isCorrect = true;
    for (const [color, required] of Object.entries(order.requiredBottles)) {
      const actual = this.intermedioMixAmounts[color] || 0;
      if (Math.abs(actual - required) > tolerance) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      this.intermedioValidationSuccess = true;
      this.intermedioShowSuccess = true;
    } else {
      this.intermedioValidationSuccess = false;
      this.intermedioValidationMessage = 'Las proporciones no son correctas. Revisa la relación entre los colores.';
      this.intermedioShowValidation = true;
    }
  }

  protected nextIntermedioOrder(): void {
    this.intermedioShowSuccess = false;
    this.intermedioCurrentOrder++;
    this.resetIntermedio();
    this.intermedioHintIndex = 0;

    if (this.intermedioCurrentOrder >= this.intermedioOrders.length) {
      Swal.fire({
        icon: 'success',
        title: '🎉 ¡Nivel Completado!',
        html: `
          <p>¡Excelente trabajo! Has completado todos los pedidos del nivel intermedio</p>
          <p>🏭 Dominaste las proporciones profesionales 🏭</p>
        `,
        confirmButtonText: 'Reiniciar nivel',
        confirmButtonColor: '#4CAF50',
        showCancelButton: true,
        cancelButtonText: 'Volver al último pedido'
      }).then((result) => {
        if (result.isConfirmed) {
          this.intermedioCurrentOrder = 0;
        } else {
          this.intermedioCurrentOrder = this.intermedioOrders.length - 1;
        }
      });
    }
  }

  protected prevIntermedioOrder(): void {
    if (this.intermedioCurrentOrder > 0) {
      this.intermedioCurrentOrder--;
      this.resetIntermedio();
      this.intermedioHintIndex = 0;
    }
  }

  protected showIntermedioHint(): void {
    const order = this.getIntermedioOrder();
    if (this.intermedioHintIndex < order.hints.length) {
      Swal.fire({
        icon: 'info',
        title: '💡 Pista',
        html: `
          <p style="font-size: 1.1rem;">${order.hints[this.intermedioHintIndex]}</p>
          <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
            Pedido ${this.intermedioCurrentOrder + 1} de ${this.intermedioOrders.length}
            • Pista ${this.intermedioHintIndex + 1} de ${order.hints.length}
          </p>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#FF9800'
      });
      this.intermedioHintIndex++;
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'No hay más pistas',
        text: 'Ya has usado todas las pistas disponibles para este pedido',
        confirmButtonText: 'OK',
        confirmButtonColor: '#FF9800'
      });
    }
  }

  // ========== MÉTODOS NIVEL UNIVERSITARIO ==========
  protected getAvanzadoActiveOrder(): Order | null {
    if (this.avanzadoActiveOrderIndex === null) return null;
    return this.avanzadoOrders[this.avanzadoActiveOrderIndex];
  }

  protected selectAvanzadoOrder(index: number): void {
    if (!this.avanzadoOrders[index].completed) {
      this.avanzadoActiveOrderIndex = index;
    }
  }

  protected getAvanzadoMixVolume(): number {
    const order = this.getAvanzadoActiveOrder();
    if (!order) return 0;
    return Object.values(order.mix).reduce((sum: number, val) => sum + (val || 0), 0);
  }

  protected getAvanzadoMixColor(): string {
    const order = this.getAvanzadoActiveOrder();
    if (!order) return 'rgb(240, 240, 240)';

    const total = this.getAvanzadoMixVolume();
    if (total === 0) return 'rgb(240, 240, 240)';

    return this.mixPigmentsToCss(order.mix);
  }

  protected adjustAvanzadoMix(color: string, delta: number): void {
    const order = this.getAvanzadoActiveOrder();
    if (!order) return;

    if (!order.mix[color]) {
      order.mix[color] = 0;
    }

    const newValue = order.mix[color] + delta;
    const available = this.avanzadoInventory[color];

    order.mix[color] = Math.max(0, Math.min(available, newValue));
  }

  protected confirmAvanzadoOrder(): void {
    const order = this.getAvanzadoActiveOrder();
    if (!order) return;

    const tolerance = 5;

    // Verificar volumen
    const total = this.getAvanzadoMixVolume();
    if (Math.abs(total - order.volume) > tolerance) {
      this.avanzadoValidationResult = {
        success: false,
        title: 'Volumen Incorrecto',
        message: `El volumen total debe ser ${order.volume}ml. Tienes ${total}ml.`
      };
      this.avanzadoShowValidation = true;
      return;
    }

    // Verificar proporciones
    let isCorrect = true;
    for (const [color, required] of Object.entries(order.requiredMix)) {
      const actual = order.mix[color] || 0;
      if (Math.abs(actual - required) > tolerance) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      // Deducir inventario
      Object.entries(order.mix).forEach(([color, amount]) => {
        if (amount > 0) {
          this.avanzadoInventory[color] -= amount;
        }
      });

      order.completed = true;
      this.avanzadoValidationResult = {
        success: true,
        title: '¡Pedido Completado!',
        message: `Has producido correctamente ${order.volume}ml de ${order.name}.`
      };
      this.avanzadoShowValidation = true;

      // Verificar si todos completados
      const allCompleted = this.avanzadoOrders.every(o => o.completed);
      if (allCompleted) {
        setTimeout(() => {
          this.avanzadoShowValidation = false;
          this.avanzadoShowComplete = true;
        }, 2000);
      }
    } else {
      this.avanzadoValidationResult = {
        success: false,
        title: 'Proporciones Incorrectas',
        message: 'La mezcla no cumple con las proporciones requeridas. Revisa la relación entre colores.'
      };
      this.avanzadoShowValidation = true;
    }
  }

  protected closeAvanzadoValidation(): void {
    this.avanzadoShowValidation = false;
    if (this.avanzadoValidationResult.success) {
      this.avanzadoActiveOrderIndex = null;
    }
  }

  protected getAvanzadoCompletedCount(): number {
    return this.avanzadoOrders.filter(o => o.completed).length;
  }

  protected getAvanzadoEfficiency(): number {
    const totalCapacity = 500 + 400 + 300 + 200; // Inventario inicial
    const totalUsed = (500 - this.avanzadoInventory['red']) +
                      (400 - this.avanzadoInventory['blue']) +
                      (300 - this.avanzadoInventory['yellow']) +
                      (200 - this.avanzadoInventory['white']);
    return (totalUsed / totalCapacity) * 100;
  }

  protected resetAvanzadoLevel(): void {
    this.avanzadoShowComplete = false;
    this.avanzadoInventory = { red: 500, blue: 400, yellow: 300, white: 200 };
    this.avanzadoOrders.forEach(o => {
      o.completed = false;
      o.mix = {};
    });
    this.avanzadoActiveOrderIndex = null;
  }

  // ========== NAVEGACIÓN DE NIVELES ==========
  protected selectLevel(level: 'inicial' | 'intermedio' | 'avanzado'): void {
    this.currentLevel.set(level);
  }
}
