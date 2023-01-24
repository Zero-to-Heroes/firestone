import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'hero-power-frame',
	styleUrls: ['./hero-power-frame.component.scss'],
	template: ` <img src="{{ image }}" class="hero-power-frame" [ngClass]="{ premium: _premium }" /> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPowerFrameComponent {
	image: string;
	_premium = false;

	private _exhausted = false;

	@Input() set exhausted(value: boolean) {
		// console.debug('[hero-power-frame] setting exhausted', value);
		this._exhausted = value;
		this.updateImage();
	}

	@Input() set premium(premium: boolean) {
		// console.debug('[hero-power-frame] setting premium', premium);
		this._premium = premium;
		this.updateImage();
	}

	private updateImage() {
		const frame = this._exhausted ? `hero_power_exhausted` : `hero_power`;
		const premium = this._premium ? '_premium' : '';
		this.image = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/hero/${frame}${premium}.png`;
	}
}
