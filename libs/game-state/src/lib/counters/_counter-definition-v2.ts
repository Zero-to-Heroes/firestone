import { CardIds, isBattlegrounds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../models/game-state';
import { CounterType } from './_exports';

export abstract class CounterDefinitionV2<T> {
	public abstract readonly id: CounterType;
	public abstract readonly image: string | ((gameState: GameState) => string);
	public readonly type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public abstract readonly cards: readonly CardIds[];
	protected debug = false;
	// Only show one instance of the counter at the same time. Useful for counters like
	// Ceaseless expanse which tracks things game-wide, instead of per-player
	protected singleton = false;

	public abstract readonly player?: {
		pref: keyof Preferences;
		display: (state: GameState, bgState: BattlegroundsState | null | undefined) => boolean;
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => T | null | undefined;
		setting: {
			label: (i18n: ILocalizationService) => string;
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService) => string;
		};
	};
	public abstract readonly opponent?: {
		pref: keyof Preferences;
		display: (state: GameState, bgState: BattlegroundsState | null | undefined) => boolean;
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => T | null | undefined;
		setting: {
			label: (i18n: ILocalizationService) => string;
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService) => string;
		};
	};

	protected abstract tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
		countersUseExpandedView: boolean,
	): string | null;

	protected cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: T | null | undefined,
	): readonly string[] | undefined {
		return undefined;
	}

	protected formatValue(value: T | null | undefined): null | undefined | number | string {
		return value == null ? null : `${value}`;
	}

	public isActive(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		prefs: Preferences,
	): boolean {
		if (this.type === 'battlegrounds' && !isBattlegrounds(gameState.metadata.gameType)) {
			return false;
		} else if (this.type === 'hearthstone' && isBattlegrounds(gameState.metadata.gameType)) {
			return false;
		}
		if (this.singleton && side === 'opponent' && this.isActive('player', gameState, bgState, prefs)) {
			return false;
		}

		if (side === 'player') {
			this.debug && console.debug('[debug] considering', gameState, bgState);
			if (!this.player?.pref || !prefs[this.player.pref]) {
				this.debug &&
					console.debug('[debug] not visible from prefs', this.player?.pref, prefs[this.player?.pref ?? '']);
				return false;
			}
			if (prefs[this.player.pref] === 'always-on') {
				return true;
			}
			if (!!this.cards?.length && !gameState.playerDeck?.hasRelevantCard(this.cards)) {
				this.debug &&
					console.debug('[debug] not visible from deck', gameState.playerDeck?.hasRelevantCard(this.cards));
				return false;
			}
			if (!this.player.display(gameState, bgState)) {
				this.debug &&
					console.debug('[debug] not visible from deck', gameState.playerDeck?.hasRelevantCard(this.cards));
				return false;
			}
			if (this.player.value(gameState, bgState) == null) {
				this.debug && console.debug('[debug] no value', this.player.value(gameState, bgState));
				return false;
			}
			this.debug && console.debug('[debug] show');
			return true;
		} else if (side === 'opponent') {
			// console.debug('checking opponent', this, this.opponent?.pref, prefs[this.opponent?.pref ?? '']);
			if (!this.opponent?.pref || !prefs[this.opponent.pref]) {
				return false;
			}
			if (prefs[this.opponent.pref] === 'always-on') {
				return true;
			}
			// console.debug('hasRelevantCard?', this, gameState.opponentDeck?.hasRelevantCard(this.cards));
			if (gameState.opponentDeck?.hasRelevantCard(this.cards)) {
				return true;
			}
			// console.debug('display', this, this.opponent.display(gameState));
			if (!this.opponent.display(gameState, bgState)) {
				return false;
			}
			// console.debug('value', this, this.opponent.value(gameState));
			if (!this.opponent.value(gameState, bgState)) {
				return false;
			}
			// console.debug('returning true', this);
			return true;
		}
		return false;
	}

	public emit(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		allCards: CardsFacadeService,
		countersUseExpandedView: boolean,
	): CounterInstance<T> {
		const rawValue =
			side === 'player' ? this.player?.value(gameState, bgState) : this.opponent?.value(gameState, bgState);
		const formattedValue = this.formatValue(rawValue);
		// Get the image value
		const image = typeof this.image === 'string' ? this.image : this.image(gameState);
		const result: CounterInstance<T> = {
			id: this.id,
			type: this.type,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${image}.jpg`,
			tooltip: this.tooltip(side, gameState, allCards, bgState, countersUseExpandedView),
			value: formattedValue,
			cardTooltip: this.cardTooltip(side, gameState, bgState, rawValue),
		};
		this.debug && console.debug('[debug] emitting counter', this.id, result);
		return result;
	}
}

export interface CounterInstance<T> {
	readonly id: CounterType;
	readonly type: 'hearthstone' | 'battlegrounds';
	readonly image: string;
	readonly tooltip: string | null;
	readonly value: string | number | undefined | null;
	readonly valueImg?: string;
	readonly cardTooltip?: readonly string[];
}
