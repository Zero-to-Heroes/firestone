import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`../../../css/component/tooltip/card-tooltip.component.scss`],
	template: `
		<div class="card-tooltip">
			<img src="{{ image() }}" *ngIf="cardId" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTooltipComponent {
	@Input() cardId: string;

	constructor() {}

	image() {
		return `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${this.cardId}.png`;
	}
}
