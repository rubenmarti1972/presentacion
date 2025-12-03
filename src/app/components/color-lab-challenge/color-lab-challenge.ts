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
    this.loadAvanzadoChallenge(1); // Cargar reto 1 por defecto
    this.applyUniformTargets();
  }

  private pouringStartTimeout: ReturnType<typeof setTimeout> | null = null;
  private pouringEndTimeout: ReturnType<typeof setTimeout> | null = null;
  protected pouringBottle: ColorBottle | null = null;
  protected pouringActive = false;

  private cubicInterpolate(t: number, A: number, B: number): number {
    const weight = t * t * (3.0 - 2.0 * t);
    return A + weight * (B - A);
  }

  private getRYBtoRGB(iR: number, iY: number, iB: number): { r: number; g: number; b: number } {
    // Normalizar inputs a rango 0-1
    const R = iR / 255.0;
    const Y = iY / 255.0;
    const B = iB / 255.0;

    // Matriz de mapeo RYB → RGB usando interpolación cúbica
    // Basado en "Paint Inspired Color Mixing" (Gossett & Chen, 2004)
    const x0 = this.cubicInterpolate(B, 1.0, 0.163);
    const x1 = this.cubicInterpolate(B, 1.0, 0.0);
    const x2 = this.cubicInterpolate(B, 1.0, 0.5);
    const x3 = this.cubicInterpolate(B, 1.0, 0.2);
    const y0 = this.cubicInterpolate(B, 1.0, 0.373);
    const y1 = this.cubicInterpolate(B, 1.0, 0.66);
    const y2 = this.cubicInterpolate(B, 0.0, 0.094);
    const y3 = this.cubicInterpolate(B, 0.5, 0.0);
    const z0 = this.cubicInterpolate(B, 0.2, 1.0);
    const z1 = this.cubicInterpolate(B, 0.094, 1.0);
    const z2 = this.cubicInterpolate(B, 0.0, 0.5);
    const z3 = this.cubicInterpolate(B, 0.0, 0.0);

    const r0 = this.cubicInterpolate(Y, x0, x1);
    const r1 = this.cubicInterpolate(Y, x2, x3);
    const g0 = this.cubicInterpolate(Y, y0, y1);
    const g1 = this.cubicInterpolate(Y, y2, y3);
    const b0 = this.cubicInterpolate(Y, z0, z1);
    const b1 = this.cubicInterpolate(Y, z2, z3);

    const r = Math.round(255 * this.cubicInterpolate(R, r0, r1));
    const g = Math.round(255 * this.cubicInterpolate(R, g0, g1));
    const b = Math.round(255 * this.cubicInterpolate(R, b0, b1));

    return { r, g, b };
  }

  private mixPigments(amounts: { red?: number; yellow?: number; blue?: number; white?: number }): { r: number; g: number; b: number } {
    const red = Math.max(0, amounts.red || 0);
    const yellow = Math.max(0, amounts.yellow || 0);
    const blue = Math.max(0, amounts.blue || 0);
    const white = Math.max(0, amounts.white || 0);

    const total = red + yellow + blue + white;

    if (total === 0) {
      return { r: 240, g: 240, b: 240 };
    }

    // Si solo hay blanco, devolver blanco
    const rybTotal = red + yellow + blue;
    if (rybTotal === 0 && white > 0) {
      return { r: 255, g: 255, b: 255 };
    }

    // Normalizar colores RYB a rango 0-255
    const rNorm = (red / rybTotal) * 255;
    const yNorm = (yellow / rybTotal) * 255;
    const bNorm = (blue / rybTotal) * 255;

    // Obtener color mezclado usando mapeo RYB → RGB
    const mixed = this.getRYBtoRGB(rNorm, yNorm, bNorm);

    // Aplicar blanco (aclarado)
    if (white > 0) {
      const whiteRatio = white / total;
      mixed.r = Math.round(mixed.r + (255 - mixed.r) * whiteRatio);
      mixed.g = Math.round(mixed.g + (255 - mixed.g) * whiteRatio);
      mixed.b = Math.round(mixed.b + (255 - mixed.b) * whiteRatio);
    }

    return mixed;
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
  protected avanzadoCurrentChallenge = 1; // 1, 2 o 3

  protected avanzadoInventory: { [key: string]: number } = {
    red: 500,
    blue: 400,
    yellow: 300,
    white: 200
  };

  // RETO 1: Proporciones Simples
  protected avanzadoChallenge1Orders: Order[] = [
    {
      name: 'Morado Corporativo',
      description: 'Cliente requiere 300ml de pintura morada. Proporción 2:3 de Rojo:Azul',
      volume: 300,
      ratio: '2:3 (Rojo:Azul)',
      targetColor: 'rgb(138, 43, 226)',
      targetRGB: { r: 138, g: 43, b: 226 },
      requiredMix: { red: 120, blue: 180 },
      mix: {},
      completed: false
    },
    {
      name: 'Verde Naturaleza',
      description: 'Campaña ambiental necesita 250ml de verde. Proporción 1:1 de Amarillo:Azul',
      volume: 250,
      ratio: '1:1 (Amarillo:Azul)',
      targetColor: 'rgb(50, 205, 50)',
      targetRGB: { r: 50, g: 205, b: 50 },
      requiredMix: { yellow: 125, blue: 125 },
      mix: {},
      completed: false
    },
    {
      name: 'Naranja Intenso',
      description: 'Señalización vial requiere 350ml de naranja. Proporción 3:2 de Rojo:Amarillo',
      volume: 350,
      ratio: '3:2 (Rojo:Amarillo)',
      targetColor: 'rgb(255, 140, 0)',
      targetRGB: { r: 255, g: 140, b: 0 },
      requiredMix: { red: 210, yellow: 140 },
      mix: {},
      completed: false
    }
  ];

  // RETO 2: Proporciones Anidadas (con Blanco)
  protected avanzadoChallenge2Orders: Order[] = [
    {
      name: 'Morado Corporativo Aclarado',
      description: '70% morado puro (2:3 Rojo:Azul) + 30% blanco. Total: 300ml',
      volume: 300,
      ratio: '70% Morado + 30% Blanco',
      targetColor: 'rgb(138, 43, 226)',
      targetRGB: { r: 138, g: 43, b: 226 },
      requiredMix: { red: 84, blue: 126, white: 90 }, // 210ml morado (84+126) + 90ml blanco
      mix: {},
      completed: false
    },
    {
      name: 'Verde Pastel',
      description: '60% verde puro (1:1 Amarillo:Azul) + 40% blanco. Total: 250ml',
      volume: 250,
      ratio: '60% Verde + 40% Blanco',
      targetColor: 'rgb(50, 205, 50)',
      targetRGB: { r: 50, g: 205, b: 50 },
      requiredMix: { yellow: 75, blue: 75, white: 100 }, // 150ml verde (75+75) + 100ml blanco
      mix: {},
      completed: false
    },
    {
      name: 'Naranja Suave',
      description: '80% naranja puro (3:2 Rojo:Amarillo) + 20% blanco. Total: 350ml',
      volume: 350,
      ratio: '80% Naranja + 20% Blanco',
      targetColor: 'rgb(255, 140, 0)',
      targetRGB: { r: 255, g: 140, b: 0 },
      requiredMix: { red: 168, yellow: 112, white: 70 }, // 280ml naranja (168+112) + 70ml blanco
      mix: {},
      completed: false
    }
  ];

  // RETO 3: Optimización de Máximo Volumen
  protected avanzadoChallenge3Orders: Order[] = [
    {
      name: 'Morado Máximo',
      description: 'Produce el MÁXIMO volumen de morado con proporción 2:3 (Rojo:Azul) sin agotar inventario',
      volume: 666, // Volumen máximo posible (limitado por azul)
      ratio: '2:3 (Rojo:Azul)',
      targetColor: 'rgb(138, 43, 226)',
      targetRGB: { r: 138, g: 43, b: 226 },
      requiredMix: { red: 266, blue: 400 }, // Usar todo el azul (400ml) → 2/5*666=266 rojo, 3/5*666=400 azul
      mix: {},
      completed: false
    },
    {
      name: 'Verde Máximo',
      description: 'Produce el MÁXIMO volumen de verde con proporción 1:1 (Amarillo:Azul) con el inventario restante',
      volume: 234, // Queda 234ml azul después del morado, amarillo no limita
      ratio: '1:1 (Amarillo:Azul)',
      targetColor: 'rgb(50, 205, 50)',
      targetRGB: { r: 50, g: 205, b: 50 },
      requiredMix: { yellow: 117, blue: 117 }, // 234ml restantes de azul → mitad cada uno
      mix: {},
      completed: false
    }
  ];

  protected avanzadoOrders: Order[] = [];

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
    }, 1800);
  }

  protected getInicialMixedColor(): string {
    if (this.inicialSelectedBottles.length === 0) return 'rgb(240, 240, 240)';

    // Contar cantidades por color
    const totals = this.inicialSelectedBottles.reduce(
      (acc, bottle) => {
        const nameLower = bottle.name.toLowerCase();
        if (nameLower.includes('rojo')) {
          acc.red += bottle.amount;
        } else if (nameLower.includes('amarillo')) {
          acc.yellow += bottle.amount;
        } else if (nameLower.includes('azul')) {
          acc.blue += bottle.amount;
        } else if (nameLower.includes('blanco')) {
          acc.white += bottle.amount;
        }
        return acc;
      },
      { red: 0, yellow: 0, blue: 0, white: 0 }
    );

    console.log('Inicial Mixed Color amounts:', totals);
    const color = this.mixPigmentsToCss(totals);
    console.log('Inicial Mixed Color result:', color);
    return color;
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

    // Contar cantidades por color basándose en los nombres de las botellas
    const amounts: { [key: string]: number } = {
      red: 0,
      blue: 0,
      yellow: 0,
      white: 0
    };

    this.inicialSelectedBottles.forEach(bottle => {
      const nameLower = bottle.name.toLowerCase();
      if (nameLower.includes('rojo')) {
        amounts.red += bottle.amount;
      } else if (nameLower.includes('azul')) {
        amounts.blue += bottle.amount;
      } else if (nameLower.includes('amarillo')) {
        amounts.yellow += bottle.amount;
      } else if (nameLower.includes('blanco')) {
        amounts.white += bottle.amount;
      }
    });

    // Verificar cantidades requeridas
    let isCorrect = true;
    const tolerance = 5; // Tolerancia de 5ml

    for (const [key, required] of Object.entries(mission.requiredBottles)) {
      const actual = amounts[key] || 0;
      if (Math.abs(actual - required) > tolerance) {
        isCorrect = false;
        console.log(`Color ${key}: esperado ${required}ml, actual ${actual}ml`);
        break;
      }
    }

    if (isCorrect) {
      // Asegurar que el popup se muestre
      setTimeout(() => {
        this.inicialShowSuccess = true;
      }, 100);
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
    // Eficiencia = % de pedidos completados correctamente
    const totalOrders = this.avanzadoOrders.length;
    const completedOrders = this.avanzadoOrders.filter(o => o.completed).length;
    return (completedOrders / totalOrders) * 100;
  }

  protected loadAvanzadoChallenge(challengeNumber: number): void {
    this.avanzadoCurrentChallenge = challengeNumber;

    // Cargar pedidos según el reto
    if (challengeNumber === 1) {
      this.avanzadoOrders = JSON.parse(JSON.stringify(this.avanzadoChallenge1Orders));
    } else if (challengeNumber === 2) {
      this.avanzadoOrders = JSON.parse(JSON.stringify(this.avanzadoChallenge2Orders));
    } else if (challengeNumber === 3) {
      this.avanzadoOrders = JSON.parse(JSON.stringify(this.avanzadoChallenge3Orders));
    }

    // Resetear estado
    this.avanzadoInventory = { red: 500, blue: 400, yellow: 300, white: 200 };
    this.avanzadoActiveOrderIndex = null;
    this.avanzadoShowValidation = false;
    this.avanzadoShowComplete = false;

    // Aplicar colores uniformes
    this.applyUniformTargets();
  }

  protected resetAvanzadoLevel(): void {
    this.loadAvanzadoChallenge(this.avanzadoCurrentChallenge);
  }

  // ========== NAVEGACIÓN DE NIVELES ==========
  protected selectLevel(level: 'inicial' | 'intermedio' | 'avanzado'): void {
    this.currentLevel.set(level);
  }
}
