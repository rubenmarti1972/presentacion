import { Component } from '@angular/core';
import { OstwaldCone } from '../ostwald-cone/ostwald-cone';
import { HelmholtzDiagram } from '../helmholtz-diagram/helmholtz-diagram';
import { CieXYZ } from '../cie-xyz/cie-xyz';

@Component({
  selector: 'app-historical-models-20th',
  standalone: true,
  imports: [OstwaldCone, HelmholtzDiagram, CieXYZ],
  templateUrl: './historical-models-20th.html',
  styleUrls: ['./historical-models-20th.scss']
})
export class HistoricalModels20th {}
