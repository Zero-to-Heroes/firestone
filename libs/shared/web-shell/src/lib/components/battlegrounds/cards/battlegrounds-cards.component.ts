import { Component } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';

@Component({
	standalone: true,
	selector: 'battlegrounds-cards',
	templateUrl: './battlegrounds-cards.component.html',
	styleUrls: ['./battlegrounds-cards.component.scss'],
	imports: [InlineSVGModule, SharedFrameworkCoreModule],
})
export class BattlegroundsCardsComponent {}
