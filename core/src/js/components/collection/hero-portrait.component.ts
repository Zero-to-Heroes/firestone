import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CollectionReferenceCard } from './collection-reference-card';

@Component({
	selector: 'hero-portrait',
	styleUrls: [`../../../css/component/collection/hero-portrait.component.scss`],
	template: `
		<div class="hero-portrait" [ngClass]="{ 'missing': !_heroPortrait.numberOwned }" rotateOnMouseOver>
			<img [src]="image" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPortraitComponent {
	@Input() set heroPortrait(value: CollectionReferenceCard) {
		this._heroPortrait = value;
		this.image = `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${value.id}.png`;
	}

	_heroPortrait: CollectionReferenceCard;
	image: string;
}
