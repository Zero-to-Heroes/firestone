import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	standalone: false,
	selector: 'bgs-quest-reward-frame',
	styleUrls: ['./bgs-quest-reward-frame.component.scss'],
	template: ` <img src="{{ image }}" class="bgs-quest-reward-frame" /> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsQuestRewardFrameComponent {
	image = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/hero/hero_power.png`;
}
