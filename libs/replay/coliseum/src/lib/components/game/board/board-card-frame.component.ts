import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'board-card-frame',
	styleUrls: ['./board-card-frame.component.scss'],
	template: `
		<div class="board-card-frame" [ngClass]="{ premium: _premium }">
			<img src="{{ imageTaunt }}" class="card-frame taunt" *ngIf="imageTaunt" />
			<img src="{{ image }}" class="card-frame" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCardFrameComponent {
	image: string;
	imageTaunt: string | undefined;
	_premium: boolean;

	private _taunt: boolean;
	private _hideStats: boolean;
	private _cardType: CardType;

	constructor(private cards: AllCardsService) {}

	@Input() set taunt(taunt: boolean) {
		this._taunt = taunt;
		this.updateImageTaunt();
	}

	@Input() set premium(premium: boolean) {
		this._premium = premium;
		this.updateImage();
		this.updateImageTaunt();
	}

	@Input() set hideStats(value: boolean) {
		this._hideStats = value;
		this.updateImage();
	}

	@Input() set cardType(value: CardType) {
		this._cardType = value;
		this.updateImage();
	}

	private updateImage() {
		const frame =
			this._cardType === CardType.LOCATION
				? 'onboard_location'
				: this._hideStats
				? 'onboard_minion_hide_stats'
				: 'onboard_minion_frame';
		const premiumFrame = this._premium ? `${frame}_premium` : frame;
		this.image = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/${premiumFrame}.png?v=2`;
	}

	private updateImageTaunt() {
		if (!this._taunt) {
			this.imageTaunt = undefined;
			return;
		}
		const frame = this._premium ? `onboard_minion_taunt_premium` : 'onboard_minion_taunt';
		this.imageTaunt = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/${frame}.png`;
	}
}
