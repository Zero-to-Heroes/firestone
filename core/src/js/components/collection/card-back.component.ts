import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InternalCardBack } from './internal-card-back';

@Component({
	selector: 'card-back',
	styleUrls: [`../../../css/component/collection/card-back.component.scss`],
	template: `
		<div
			class="card-back"
			*ngIf="_cardBack"
			[ngClass]="{ 'missing': !_cardBack.owned }"
			[helpTooltip]="_cardBack.name"
			rotateOnMouseOver
		>
			<div class="perspective-wrapper" rotateOnMouseOver>
				<img [src]="_cardBack.image + '?v=3'" />
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBackComponent {
	@Input() set cardBack(value: InternalCardBack) {
		this._cardBack = value;
	}

	@Input() animated: boolean;
	@Input() alwaysOn: boolean;

	_cardBack: InternalCardBack;
}
