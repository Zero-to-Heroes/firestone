import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'hero-art',
	styleUrls: ['./hero-art.component.scss'],
	template: ` <img src="{{ image }}" class="hero-art" /> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroArtComponent {
	image: string;

	@Input() set cardId(cardId: string | undefined) {
		// console.debug('[hero-art] setting cardId', cardId);
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}
}
