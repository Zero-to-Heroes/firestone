import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatClass } from '../../services/hs-utils';
import { CollectionReferenceCard } from './collection-reference-card';

@Component({
	selector: 'hero-portrait',
	styleUrls: [`../../../css/component/collection/hero-portrait.component.scss`],
	template: `
		<div
			class="hero-portrait"
			[ngClass]="{ 'missing': !_heroPortrait.numberOwned }"
			[helpTooltip]="playerClass"
			[helpTooltipPosition]="'top'"
			rotateOnMouseOver
		>
			<div class="perspective-wrapper" rotateOnMouseOver>
				<img [src]="image" />
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPortraitComponent {
	@Input() set heroPortrait(value: CollectionReferenceCard) {
		this._heroPortrait = value;
		this.image = `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${value.id}.png?v=3`;
		this.playerClass = formatClass(value.playerClass);
	}

	_heroPortrait: CollectionReferenceCard;
	image: string;
	playerClass: string;
}
