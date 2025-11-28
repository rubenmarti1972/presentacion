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

  // Nivel actual
  protected currentLevel = signal<'infantil' | 'secundaria' | 'universitario'>('infantil');

  // ========== NIVEL INFANTIL ==========
  protected infantilMissions: Mission[] = [
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

  protected infantilCurrentMission = 0;
  protected infantilSelectedBottles: ColorBottle[] = [];
  protected infantilAvailableBottles: ColorBottle[] = [
    { id: 'red-100', name: 'Rojo', color: 'rgb(255, 0, 0)', rgb: { r: 255, g: 0, b: 0 }, amount: 100 },
    { id: 'blue-100', name: 'Azul', color: 'rgb(0, 0, 255)', rgb: { r: 0, g: 0, b: 255 }, amount: 100 },
    { id: 'yellow-100', name: 'Amarillo', color: 'rgb(255, 255, 0)', rgb: { r: 255, g: 255, b: 0 }, amount: 100 },
    { id: 'red-150', name: 'Rojo', color: 'rgb(255, 0, 0)', rgb: { r: 255, g: 0, b: 0 }, amount: 150 },
    { id: 'blue-150', name: 'Azul', color: 'rgb(0, 0, 255)', rgb: { r: 0, g: 0, b: 255 }, amount: 150 },
    { id: 'blue-200', name: 'Azul', color: 'rgb(0, 0, 255)', rgb: { r: 0, g: 0, b: 255 }, amount: 200 },
    { id: 'yellow-150', name: 'Amarillo', color: 'rgb(255, 255, 0)', rgb: { r: 255, g: 255, b: 0 }, amount: 150 }
  ];
  protected infantilShowSuccess = false;
  protected infantilHintLevel = 0;

  // ========== NIVEL SECUNDARIA ==========
  protected secundariaOrders: Mission[] = [
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

  protected secundariaCurrentOrder = 0;
  protected secundariaMixAmounts: { [key: string]: number } = { red: 0, blue: 0, yellow: 0, white: 0 };
  protected secundariaShowSuccess = false;
  protected secundariaShowValidation = false;
  protected secundariaValidationMessage = '';
  protected secundariaValidationSuccess = false;
  protected secundariaHintIndex = 0;

  // ========== NIVEL UNIVERSITARIO ==========
  protected universitarioInventory: { [key: string]: number } = {
    red: 500,
    blue: 400,
    yellow: 300,
    white: 200
  };

  protected universitarioOrders: Order[] = [
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

  protected universitarioActiveOrderIndex: number | null = null;
  protected universitarioShowValidation = false;
  protected universitarioValidationResult = { success: false, title: '', message: '' };
  protected universitarioShowComplete = false;

  // ========== MÉTODOS NIVEL INFANTIL ==========
  protected getInfantilMission(): Mission {
    return this.infantilMissions[this.infantilCurrentMission];
  }

  protected addBottleToMixer(bottle: ColorBottle): void {
    this.infantilSelectedBottles.push({ ...bottle });
  }

  protected clearInfantilMixer(): void {
    this.infantilSelectedBottles = [];
  }

  protected getInfantilMixedColor(): string {
    if (this.infantilSelectedBottles.length === 0) return 'rgb(240, 240, 240)';

    const total = this.infantilSelectedBottles.reduce((sum, b) => sum + b.amount, 0);
    let r = 0, g = 0, b = 0;

    this.infantilSelectedBottles.forEach(bottle => {
      const weight = bottle.amount / total;
      r += bottle.rgb.r * weight;
      g += bottle.rgb.g * weight;
      b += bottle.rgb.b * weight;
    });

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  protected getInfantilTotalVolume(): number {
    return this.infantilSelectedBottles.reduce((sum, b) => sum + b.amount, 0);
  }

  protected checkInfantilSolution(): void {
    const mission = this.getInfantilMission();
    const total = this.getInfantilTotalVolume();

    // Verificar volumen
    if (total !== mission.targetVolume) {
      Swal.fire({
        icon: 'error',
        title: '¡Ups! Volumen incorrecto',
        html: `
          <p>El volumen total debe ser <strong>${mission.targetVolume}ml</strong></p>
          <p>Actualmente tienes <strong>${total}ml</strong></p>
          <p style="margin-top: 1rem;">Estás en la <strong>Misión ${this.infantilCurrentMission + 1}</strong> de ${this.infantilMissions.length}</p>
        `,
        confirmButtonText: '¡Intentaré de nuevo!',
        confirmButtonColor: '#4CAF50',
        showCancelButton: this.infantilCurrentMission > 0,
        cancelButtonText: '← Misión anterior',
        footer: '<small>💡 Puedes pedir una pista si lo necesitas</small>'
      }).then((result) => {
        if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
          this.prevInfantilMission();
        }
      });
      return;
    }

    // Contar cantidades por color
    const amounts: { [key: string]: number } = {};
    this.infantilSelectedBottles.forEach(bottle => {
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
      this.infantilShowSuccess = true;
    } else {
      Swal.fire({
        icon: 'warning',
        title: '¡Casi lo logras!',
        html: `
          <p>Las proporciones no son correctas 😔</p>
          <p>Revisa las cantidades de cada color</p>
          <p style="margin-top: 1rem;">Estás en la <strong>Misión ${this.infantilCurrentMission + 1}</strong> de ${this.infantilMissions.length}</p>
        `,
        confirmButtonText: '¡Seguir intentando!',
        confirmButtonColor: '#FF9800',
        showCancelButton: this.infantilCurrentMission > 0,
        cancelButtonText: '← Misión anterior',
        footer: '<small>💡 Puedes pedir una pista si lo necesitas</small>'
      }).then((result) => {
        if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
          this.prevInfantilMission();
        }
      });
    }
  }

  protected nextInfantilMission(): void {
    this.infantilShowSuccess = false;
    this.infantilCurrentMission++;
    this.clearInfantilMixer();
    this.infantilHintLevel = 0;

    if (this.infantilCurrentMission >= this.infantilMissions.length) {
      Swal.fire({
        icon: 'success',
        title: '🎉 ¡Nivel Completado!',
        html: `
          <p>¡Felicidades! Has completado todas las misiones del nivel infantil</p>
          <p>🎨 Dominaste las mezclas de colores 🎨</p>
        `,
        confirmButtonText: 'Reiniciar nivel',
        confirmButtonColor: '#4CAF50',
        showCancelButton: true,
        cancelButtonText: 'Volver a la última misión'
      }).then((result) => {
        if (result.isConfirmed) {
          this.infantilCurrentMission = 0;
        } else {
          this.infantilCurrentMission = this.infantilMissions.length - 1;
        }
      });
    }
  }

  protected prevInfantilMission(): void {
    if (this.infantilCurrentMission > 0) {
      this.infantilCurrentMission--;
      this.clearInfantilMixer();
      this.infantilHintLevel = 0;
    }
  }

  protected showInfantilHint(): void {
    const mission = this.getInfantilMission();
    if (this.infantilHintLevel < mission.hints.length) {
      Swal.fire({
        icon: 'info',
        title: '💡 Pista',
        html: `
          <p style="font-size: 1.1rem;">${mission.hints[this.infantilHintLevel]}</p>
          <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
            Misión ${this.infantilCurrentMission + 1} de ${this.infantilMissions.length}
            • Pista ${this.infantilHintLevel + 1} de ${mission.hints.length}
          </p>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#FF9800'
      });
      this.infantilHintLevel++;
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
  protected getSecundariaOrder(): Mission {
    return this.secundariaOrders[this.secundariaCurrentOrder];
  }

  protected getSecundariaTotalVolume(): number {
    return Object.values(this.secundariaMixAmounts).reduce((sum, val) => sum + val, 0);
  }

  protected getSecundariaMixedColor(): string {
    const total = this.getSecundariaTotalVolume();
    if (total === 0) return 'rgb(240, 240, 240)';

    const colorMap: { [key: string]: { r: number; g: number; b: number } } = {
      red: { r: 255, g: 0, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      yellow: { r: 255, g: 255, b: 0 },
      white: { r: 255, g: 255, b: 255 }
    };

    let r = 0, g = 0, b = 0;
    Object.entries(this.secundariaMixAmounts).forEach(([color, amount]) => {
      if (amount > 0 && colorMap[color]) {
        const weight = amount / total;
        r += colorMap[color].r * weight;
        g += colorMap[color].g * weight;
        b += colorMap[color].b * weight;
      }
    });

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  protected adjustSecundariaAmount(color: string, delta: number): void {
    this.secundariaMixAmounts[color] = Math.max(0, this.secundariaMixAmounts[color] + delta);
  }

  protected resetSecundaria(): void {
    this.secundariaMixAmounts = { red: 0, blue: 0, yellow: 0, white: 0 };
    this.secundariaShowValidation = false;
  }

  protected validateSecundariaOrder(): void {
    const order = this.getSecundariaOrder();
    const total = this.getSecundariaTotalVolume();
    const tolerance = 5;

    // Verificar volumen
    if (Math.abs(total - order.targetVolume) > tolerance) {
      this.secundariaValidationSuccess = false;
      this.secundariaValidationMessage = `El volumen total debe ser ${order.targetVolume}ml. Tienes ${total}ml.`;
      this.secundariaShowValidation = true;
      return;
    }

    // Verificar proporciones
    let isCorrect = true;
    for (const [color, required] of Object.entries(order.requiredBottles)) {
      const actual = this.secundariaMixAmounts[color] || 0;
      if (Math.abs(actual - required) > tolerance) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      this.secundariaValidationSuccess = true;
      this.secundariaShowSuccess = true;
    } else {
      this.secundariaValidationSuccess = false;
      this.secundariaValidationMessage = 'Las proporciones no son correctas. Revisa la relación entre los colores.';
      this.secundariaShowValidation = true;
    }
  }

  protected nextSecundariaOrder(): void {
    this.secundariaShowSuccess = false;
    this.secundariaCurrentOrder++;
    this.resetSecundaria();
    this.secundariaHintIndex = 0;

    if (this.secundariaCurrentOrder >= this.secundariaOrders.length) {
      Swal.fire({
        icon: 'success',
        title: '🎉 ¡Nivel Completado!',
        html: `
          <p>¡Excelente trabajo! Has completado todos los pedidos del nivel secundaria</p>
          <p>🏭 Dominaste las proporciones profesionales 🏭</p>
        `,
        confirmButtonText: 'Reiniciar nivel',
        confirmButtonColor: '#4CAF50',
        showCancelButton: true,
        cancelButtonText: 'Volver al último pedido'
      }).then((result) => {
        if (result.isConfirmed) {
          this.secundariaCurrentOrder = 0;
        } else {
          this.secundariaCurrentOrder = this.secundariaOrders.length - 1;
        }
      });
    }
  }

  protected prevSecundariaOrder(): void {
    if (this.secundariaCurrentOrder > 0) {
      this.secundariaCurrentOrder--;
      this.resetSecundaria();
      this.secundariaHintIndex = 0;
    }
  }

  protected showSecundariaHint(): void {
    const order = this.getSecundariaOrder();
    if (this.secundariaHintIndex < order.hints.length) {
      Swal.fire({
        icon: 'info',
        title: '💡 Pista',
        html: `
          <p style="font-size: 1.1rem;">${order.hints[this.secundariaHintIndex]}</p>
          <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
            Pedido ${this.secundariaCurrentOrder + 1} de ${this.secundariaOrders.length}
            • Pista ${this.secundariaHintIndex + 1} de ${order.hints.length}
          </p>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#FF9800'
      });
      this.secundariaHintIndex++;
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
  protected getUniversitarioActiveOrder(): Order | null {
    if (this.universitarioActiveOrderIndex === null) return null;
    return this.universitarioOrders[this.universitarioActiveOrderIndex];
  }

  protected selectUniversitarioOrder(index: number): void {
    if (!this.universitarioOrders[index].completed) {
      this.universitarioActiveOrderIndex = index;
    }
  }

  protected getUniversitarioMixVolume(): number {
    const order = this.getUniversitarioActiveOrder();
    if (!order) return 0;
    return Object.values(order.mix).reduce((sum: number, val) => sum + (val || 0), 0);
  }

  protected getUniversitarioMixColor(): string {
    const order = this.getUniversitarioActiveOrder();
    if (!order) return 'rgb(240, 240, 240)';

    const total = this.getUniversitarioMixVolume();
    if (total === 0) return 'rgb(240, 240, 240)';

    const colorMap: { [key: string]: { r: number; g: number; b: number } } = {
      red: { r: 255, g: 0, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      yellow: { r: 255, g: 255, b: 0 },
      white: { r: 255, g: 255, b: 255 }
    };

    let r = 0, g = 0, b = 0;
    Object.entries(order.mix).forEach(([color, amount]) => {
      if (amount > 0 && colorMap[color]) {
        const weight = amount / total;
        r += colorMap[color].r * weight;
        g += colorMap[color].g * weight;
        b += colorMap[color].b * weight;
      }
    });

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  protected adjustUniversitarioMix(color: string, delta: number): void {
    const order = this.getUniversitarioActiveOrder();
    if (!order) return;

    if (!order.mix[color]) {
      order.mix[color] = 0;
    }

    const newValue = order.mix[color] + delta;
    const available = this.universitarioInventory[color];

    order.mix[color] = Math.max(0, Math.min(available, newValue));
  }

  protected confirmUniversitarioOrder(): void {
    const order = this.getUniversitarioActiveOrder();
    if (!order) return;

    const tolerance = 5;

    // Verificar volumen
    const total = this.getUniversitarioMixVolume();
    if (Math.abs(total - order.volume) > tolerance) {
      this.universitarioValidationResult = {
        success: false,
        title: 'Volumen Incorrecto',
        message: `El volumen total debe ser ${order.volume}ml. Tienes ${total}ml.`
      };
      this.universitarioShowValidation = true;
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
          this.universitarioInventory[color] -= amount;
        }
      });

      order.completed = true;
      this.universitarioValidationResult = {
        success: true,
        title: '¡Pedido Completado!',
        message: `Has producido correctamente ${order.volume}ml de ${order.name}.`
      };
      this.universitarioShowValidation = true;

      // Verificar si todos completados
      const allCompleted = this.universitarioOrders.every(o => o.completed);
      if (allCompleted) {
        setTimeout(() => {
          this.universitarioShowValidation = false;
          this.universitarioShowComplete = true;
        }, 2000);
      }
    } else {
      this.universitarioValidationResult = {
        success: false,
        title: 'Proporciones Incorrectas',
        message: 'La mezcla no cumple con las proporciones requeridas. Revisa la relación entre colores.'
      };
      this.universitarioShowValidation = true;
    }
  }

  protected closeUniversitarioValidation(): void {
    this.universitarioShowValidation = false;
    if (this.universitarioValidationResult.success) {
      this.universitarioActiveOrderIndex = null;
    }
  }

  protected getUniversitarioCompletedCount(): number {
    return this.universitarioOrders.filter(o => o.completed).length;
  }

  protected getUniversitarioEfficiency(): number {
    const totalCapacity = 500 + 400 + 300 + 200; // Inventario inicial
    const totalUsed = (500 - this.universitarioInventory['red']) +
                      (400 - this.universitarioInventory['blue']) +
                      (300 - this.universitarioInventory['yellow']) +
                      (200 - this.universitarioInventory['white']);
    return (totalUsed / totalCapacity) * 100;
  }

  protected resetUniversitarioLevel(): void {
    this.universitarioShowComplete = false;
    this.universitarioInventory = { red: 500, blue: 400, yellow: 300, white: 200 };
    this.universitarioOrders.forEach(o => {
      o.completed = false;
      o.mix = {};
    });
    this.universitarioActiveOrderIndex = null;
  }

  // ========== NAVEGACIÓN DE NIVELES ==========
  protected selectLevel(level: 'infantil' | 'secundaria' | 'universitario'): void {
    this.currentLevel.set(level);
  }
}
