import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'hero-frame',
	styleUrls: ['./hero-frame.component.scss'],
	template: ` <img src="{{ image }}" class="hero-frame" /> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroFrameComponent {
	image: string;
	_premium = false;

	@Input() set premium(premium: boolean) {
		console.debug('[hero-frame] setting premium', premium);
		this._premium = premium;
		const premiumSuffix = premium ? '_premium' : '';
		this.image = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/hero/hero_frame${premiumSuffix}.png`;
	}
}
