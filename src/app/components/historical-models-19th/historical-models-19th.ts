import { Component } from '@angular/core';
import { RungeColorSphere } from '../runge-color-sphere/runge-color-sphere';
import { MaxwellTriangle } from '../maxwell-triangle/maxwell-triangle';
import { BensonCube } from '../benson-cube/benson-cube';

@Component({
  selector: 'app-historical-models-19th',
  standalone: true,
  imports: [RungeColorSphere, MaxwellTriangle, BensonCube],
  templateUrl: './historical-models-19th.html',
  styleUrls: ['./historical-models-19th.scss']
})
export class HistoricalModels19th {}
