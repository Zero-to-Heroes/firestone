import { Component } from '@angular/core';
import { InlineSVGModule } from 'ng-inline-svg-2';

@Component({
	standalone: true,
	selector: 'battlegrounds-heroes',
	templateUrl: './battlegrounds-heroes.component.html',
	styleUrls: ['./battlegrounds-heroes.component.scss'],
	imports: [InlineSVGModule],
})
export class BattlegroundsHeroesComponent {}
