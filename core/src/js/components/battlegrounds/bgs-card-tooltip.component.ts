import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`../../../css/component/battlegrounds/bgs-card-tooltip.component.scss`],
	template: `
		<card
			[ngClass]="{ 'hidden': !_visible }"
			class="tooltip"
			[forbiddenTargetSource]="true"
			[entity]="_entity"
			[hasTooltip]="false"
			[aspectRatio]="0.75"
			*ngIf="_entity"
		>
		</card>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsCardTooltipComponent {
	_entity: Entity;
	_visible: boolean;

	@Input() set config(value: Entity) {
		if (value === this._entity) {
			return;
		}
		this._entity = value;
		// console.log('setting card in tooltip', value);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set visible(value: boolean) {
		if (value === this._visible) {
			return;
		}
		// console.log('setting visible in tooltip', value);
		this._visible = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
