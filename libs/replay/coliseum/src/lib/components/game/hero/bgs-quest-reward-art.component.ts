import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	standalone: false,
	selector: 'bgs-quest-reward-art',
	styleUrls: ['./bgs-quest-reward-art.component.scss'],
	template: ` <img src="{{ image }}" class="bgs-quest-reward-art" /> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsQuestRewardArtComponent {
	image: string;

	@Input() set cardId(cardId: string) {
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}
}
