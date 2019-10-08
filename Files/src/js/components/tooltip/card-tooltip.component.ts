import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`../../../css/component/tooltip/card-tooltip.component.scss`],
	template: `
		<div class="card-tooltip">
			<img [src]="image" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTooltipComponent {
	image: string;

	constructor(private cdr: ChangeDetectorRef) {}

	@Input() set cardId(value: string) {
		this.image = `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${value}.png`;
		// console.log('setting tooltip', value, this.image);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
