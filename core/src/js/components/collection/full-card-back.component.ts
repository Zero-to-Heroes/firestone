import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardBack } from '../../models/card-back';
import { Preferences } from '../../models/preferences';
import { InternalCardBack } from './internal-card-back';

declare let amplitude;

@Component({
	selector: 'full-card-back',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/scrollbar.scss`,
		`../../../css/component/collection/full-card-back.component.scss`,
	],
	template: `
		<div class="card-back-details-container" *ngIf="_cardBack">
			<card-back class="card-back" [cardBack]="_cardBack" [animated]="_animated" [alwaysOn]="true">/</card-back>
			<div class="details">
				<h1>{{ _cardBack.name }}</h1>
				<div class="card-back-details">
					<div class="card-back-info description">
						<span class="value">{{ _cardBack.text }}</span>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullCardBackComponent {
	_cardBack: InternalCardBack;
	_animated: boolean;

	@Input() set cardBack(value: CardBack) {
		if (!value) {
			return;
		}
		this._cardBack = {
			...value,
			image: `https://static.zerotoheroes.com/hearthstone/cardBacks/${value.id}.png`,
			animatedImage: `https://static.zerotoheroes.com/hearthstone/cardBacks/animated/${value.id}.webm`,
		};
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set prefs(value: Preferences) {
		this._animated = value?.collectionUseAnimatedCardBacks;
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
