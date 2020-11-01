import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../models/decktracker/game-state';

declare let amplitude;

@Component({
	selector: 'galakrond-counter',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/game-counters/counters-common.scss',
		'../../../css/component/game-counters/galakrond-counter.component.scss',
		`../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div
			class="counter galakrond-counter"
			[helpTooltip]="
				(_side === 'player' ? 'You have ' : 'Your opponent has ') +
				'invoked Galakrond ' +
				invokeCount +
				' times'
			"
		>
			<img class="image" [src]="image" />
			<div class="frame"></div>
			<div class="value">{{ invokeCount }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalakrondCountersComponent {
	invokeCount: number;
	image: string;
	_side: 'player' | 'opponent';

	private _state: GameState;

	@Input() set state(value: GameState) {
		this._state = value;
		this.updateInfo();
	}

	@Input() set side(value: 'player' | 'opponent') {
		this._side = value;
		this.updateInfo();
	}

	constructor(private readonly cdr: ChangeDetectorRef) {
		this.cdr.detach();
	}

	private updateInfo() {
		if (!this._state || !this._side) {
			return;
		}

		const deck = this._side === 'player' ? this._state.playerDeck : this._state.opponentDeck;
		if (!deck) {
			return;
		}

		if ((deck.galakrondInvokesCount || 0) === this.invokeCount) {
			return;
		}

		this.invokeCount = deck.galakrondInvokesCount || 0;
		const galakrondCard = this.getGalakrondCardFor(deck.hero?.playerClass?.toLowerCase(), this.invokeCount);
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${galakrondCard}.jpg`;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private getGalakrondCardFor(className: string, invokeCount: number) {
		switch (className) {
			case 'priest':
				if (invokeCount >= 4) {
					return CardIds.NonCollectible.Priest.GalakrondtheUnspeakable_GalakrondAzerothsEndToken;
				} else if (invokeCount >= 2) {
					return CardIds.NonCollectible.Priest.GalakrondtheUnspeakable_GalakrondTheApocalypseToken;
				}
				return CardIds.Collectible.Priest.GalakrondTheUnspeakable;
			case 'rogue':
				if (invokeCount >= 4) {
					return CardIds.NonCollectible.Rogue.GalakrondtheNightmare_GalakrondAzerothsEndToken;
				} else if (invokeCount >= 2) {
					return CardIds.NonCollectible.Rogue.GalakrondtheNightmare_GalakrondTheApocalypseToken;
				}
				return CardIds.Collectible.Rogue.GalakrondTheNightmare;
			case 'shaman':
				if (invokeCount >= 4) {
					return CardIds.NonCollectible.Shaman.GalakrondtheTempest_GalakrondAzerothsEndToken;
				} else if (invokeCount >= 2) {
					return CardIds.NonCollectible.Shaman.GalakrondtheTempest_GalakrondTheApocalypseToken;
				}
				return CardIds.Collectible.Shaman.GalakrondTheTempest;
			case 'warlock':
				if (invokeCount >= 4) {
					return CardIds.NonCollectible.Warlock.GalakrondtheWretched_GalakrondAzerothsEndToken;
				} else if (invokeCount >= 2) {
					return CardIds.NonCollectible.Warlock.GalakrondtheWretched_GalakrondTheApocalypseToken;
				}
				return CardIds.Collectible.Warlock.GalakrondTheWretched;
			case 'warrior':
				if (invokeCount >= 4) {
					return CardIds.NonCollectible.Warrior.GalakrondtheUnbreakable_GalakrondAzerothsEndToken;
				} else if (invokeCount >= 2) {
					return CardIds.NonCollectible.Warrior.GalakrondtheUnbreakable_GalakrondTheApocalypseToken;
				}
				return CardIds.Collectible.Warrior.GalakrondTheUnbreakable;
		}
		return CardIds.Collectible.Rogue.GalakrondTheNightmare;
	}
}
