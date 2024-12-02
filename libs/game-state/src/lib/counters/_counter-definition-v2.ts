import { CardIds } from '@firestone-hs/reference-data';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../models/game-state';
import { CounterType } from './_exports';

export abstract class CounterDefinitionV2<T> {
	public abstract readonly id: CounterType;
	public abstract readonly image: string;
	protected abstract readonly cards: readonly CardIds[];
	protected debug = false;

	public abstract readonly player?: {
		pref: keyof Preferences;
		display: (state: GameState) => boolean;
		value: (state: GameState) => T;
		setting: {
			label: (i18n: ILocalizationService) => string;
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService) => string;
		};
	};
	public abstract readonly opponent?: {
		pref: keyof Preferences;
		display: (state: GameState) => boolean;
		value: (state: GameState) => T;
		setting: {
			label: (i18n: ILocalizationService) => string;
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService) => string;
		};
	};

	protected abstract tooltip(side: 'player' | 'opponent', gameState: GameState): string | null;

	public isActive(side: 'player' | 'opponent', gameState: GameState, prefs: Preferences): boolean {
		if (side === 'player') {
			if (!this.player?.pref || !prefs[this.player.pref]) {
				// console.debug('not visible from prefs', this.player?.pref, prefs[this.player?.pref ?? '']);
				return false;
			}
			if (!gameState.playerDeck?.hasRelevantCard(this.cards)) {
				return false;
			}
			if (!this.player.display(gameState)) {
				// console.debug(
				// 	'not visible from deck',
				// 	gameState.playerDeck?.hasRelevantCard(this.cards),
				// 	this.player.display(gameState),
				// );
				return false;
			}
			if (this.player.value(gameState) == null) {
				return false;
			}
			return true;
		} else if (side === 'opponent') {
			console.debug('checking opponent', this, this.opponent?.pref, prefs[this.opponent?.pref ?? '']);
			if (!this.opponent?.pref || !prefs[this.opponent.pref]) {
				return false;
			}
			console.debug('hasRelevantCard?', this, gameState.opponentDeck?.hasRelevantCard(this.cards));
			if (gameState.opponentDeck?.hasRelevantCard(this.cards)) {
				return true;
			}
			console.debug('display', this, this.opponent.display(gameState));
			if (!this.opponent.display(gameState)) {
				return false;
			}
			console.debug('value', this, this.opponent.value(gameState));
			if (!this.opponent.value(gameState)) {
				return false;
			}
			console.debug('returning true', this);
			return true;
		}
		return false;
	}

	public emit(side: 'player' | 'opponent', gameState: GameState): CounterInstance<T> {
		// console.debug('emitting counter', this.id, this);
		const result: CounterInstance<T> = {
			id: this.id,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.image}.jpg`,
			tooltip: this.tooltip(side, gameState),
			value: side === 'player' ? this.player?.value(gameState) : this.opponent?.value(gameState),
		};
		return result;
	}
}

export interface CounterInstance<T> {
	readonly id: CounterType;
	readonly image: string;
	readonly tooltip: string | null;
	readonly value: T | undefined;
	readonly valueImg?: string;
}
