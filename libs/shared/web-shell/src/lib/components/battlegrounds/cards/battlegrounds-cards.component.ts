import { Component } from '@angular/core';
import { InlineSVGModule } from 'ng-inline-svg-2';

@Component({
	standalone: true,
	selector: 'battlegrounds-cards',
	templateUrl: './battlegrounds-cards.component.html',
	styleUrls: ['./battlegrounds-cards.component.scss'],
	imports: [InlineSVGModule],
})
export class BattlegroundsCardsComponent {}
