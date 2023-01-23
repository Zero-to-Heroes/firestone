import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'weapon-art',
	styleUrls: ['./weapon-art.component.scss'],
	template: ` <img src="{{ image }}" class="weapon-art" /> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeaponArtComponent {
	image: string;

	@Input() set cardId(cardId: string) {
		console.debug('[weapon-art] setting cardId', cardId);
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}
}
