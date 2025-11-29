import { Component, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Footer } from './components/footer/footer';
import { ColorTriangle } from './components/color-triangle/color-triangle';
import { ColorLabChallenge } from './components/color-lab-challenge/color-lab-challenge';
import { HistoricalModels19th } from './components/historical-models-19th/historical-models-19th';
import { HistoricalModels20th } from './components/historical-models-20th/historical-models-20th';
import { MacadamEllipses } from './components/macadam-ellipses/macadam-ellipses';

interface Slide {
  id: string;
  title: string;
}

@Component({
  selector: 'app-root',
  imports: [
    CommonModule, Footer, ColorTriangle, ColorLabChallenge,
    HistoricalModels19th, HistoricalModels20th, MacadamEllipses
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected currentSlideId = signal<string>('intro');

  // Lista de slides de la presentación
  protected readonly slides: Slide[] = [
    { id: 'intro', title: 'RGB y CMYK' },
    { id: 'circulo-cromatico', title: 'Círculo Cromático' },
    { id: 'newton', title: 'Newton y el Círculo Cromático' },
    { id: 'espectro', title: 'Espectro de luz' },
    { id: 'geometria-color', title: 'Geometría del Color' },
    { id: 'historical-19th', title: 'Modelos del Siglo XIX' },
    { id: 'historical-20th', title: 'Modelos del Siglo XX' },
    { id: 'macadam', title: 'Elipses de MacAdam (1942)' },
    { id: 'juego-colores', title: 'Laboratorio de Mezcla de Colores' },
    { id: 'cantoral-dimensiones', title: 'Construcción Social del Conocimiento Matemático' },
    { id: 'preguntas-epistemologica', title: 'Dimensión Epistemológica' },
    { id: 'preguntas-cognitiva', title: 'Dimensión Cognitiva' },
    { id: 'preguntas-didactica', title: 'Dimensión Didáctica' },
    { id: 'preguntas-social', title: 'Dimensión Social' },
    { id: 'teorema-diagonal', title: 'Inconmensurabilidad de la diagonal' },
    { id: 'demostracion', title: 'Demostración' }
  ];

  constructor() {
    // Sync hash with currentSlideId
    effect(() => {
      const slideId = this.currentSlideId();
      if (window.location.hash !== `#${slideId}`) {
        window.location.hash = slideId;
      }
    });
  }

  ngOnInit() {
    // Initialize from hash or default to first slide
    const hash = window.location.hash.slice(1);
    const slideExists = this.slides.some(s => s.id === hash);
    if (hash && slideExists) {
      this.currentSlideId.set(hash);
    } else {
      window.location.hash = this.slides[0].id;
    }

    // Listen to hash changes
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.slice(1);
      const slideExists = this.slides.some(s => s.id === newHash);
      if (slideExists && newHash !== this.currentSlideId()) {
        this.currentSlideId.set(newHash);
      }
    });
  }

  protected getCurrentSlideIndex(): number {
    return this.slides.findIndex(s => s.id === this.currentSlideId());
  }

  protected nextSlide() {
    const currentIndex = this.getCurrentSlideIndex();
    if (currentIndex < this.slides.length - 1) {
      this.currentSlideId.set(this.slides[currentIndex + 1].id);
    }
  }

  protected prevSlide() {
    const currentIndex = this.getCurrentSlideIndex();
    if (currentIndex > 0) {
      this.currentSlideId.set(this.slides[currentIndex - 1].id);
    }
  }

  protected goToSlide(slideId: string) {
    this.currentSlideId.set(slideId);
  }

  protected isCurrentSlide(slideId: string): boolean {
    return this.currentSlideId() === slideId;
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getCurrentMonth(): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[new Date().getMonth()];
  }
}
