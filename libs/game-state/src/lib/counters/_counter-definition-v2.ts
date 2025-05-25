/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, isBattlegrounds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../models/game-state';
import { CounterType } from './_exports';

export abstract class CounterDefinitionV2<T> {
	public abstract readonly id: CounterType;
	public abstract readonly image:
		| string
		| ((gameState: GameState, side: 'player' | 'opponent') => string | undefined);
	public readonly valueImg: string | undefined = undefined;
	public readonly imageIcon: string | undefined = undefined;
	public readonly type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public abstract readonly cards: readonly CardIds[];
	protected debug = false;
	// Only show one instance of the counter at the same time. Useful for counters like
	// Ceaseless expanse which tracks things game-wide, instead of per-player
	protected singleton = false;

	public abstract readonly player?: PlayerImplementation<T>;
	public abstract readonly opponent?: PlayerImplementation<T>;

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

		if (!gameState?.gameStarted || gameState.gameEnded) {
			this.debug &&
				console.debug(
					'[debug] game not started or ended',
					this.id,
					side,
					gameState.gameStarted,
					gameState.gameEnded,
				);
			return false;
		}

		if (side === 'player') {
			this.debug && console.debug('[debug] considering', this.id, side, gameState, bgState);
			if (!this.player?.pref || !prefs[this.player.pref]) {
				this.debug &&
					console.debug(
						'[debug] not visible from prefs',
						this.id,
						side,
						this.player?.pref,
						prefs[this.player?.pref ?? ''],
					);
				return false;
			}
			if (prefs[this.player.pref] === 'always-on') {
				return true;
			}
			if (!!this.cards?.length && !gameState.playerDeck?.hasRelevantCard(this.cards)) {
				this.debug &&
					console.debug(
						'[debug] not visible from deck',
						this.id,
						side,
						gameState.playerDeck?.hasRelevantCard(this.cards),
					);
				return false;
			}
			if (!this.player.display(gameState, bgState)) {
				this.debug &&
					console.debug(
						'[debug] not visible from deck',
						this.id,
						side,
						gameState.playerDeck?.hasRelevantCard(this.cards),
					);
				return false;
			}
			if ((this.player.cachedValue = this.player.value(gameState, bgState)) == null) {
				this.debug && console.debug('[debug] no value', this.id, side, this.player.cachedValue);
				return false;
			}
			this.debug && console.debug('[debug] show', this.id, side, gameState, bgState);
			return true;
		} else if (side === 'opponent') {
			this.debug &&
				console.debug(
					'checking opponent',
					this.id,
					side,
					this.opponent?.pref,
					prefs[this.opponent?.pref ?? ''],
				);
			if (!this.opponent?.pref || !prefs[this.opponent.pref]) {
				this.debug && console.debug('hiding for pref', this.id, side);
				return false;
			}
			if (prefs[this.opponent.pref] === 'always-on') {
				this.debug && console.debug('showing as always-on', this.id, side);
				return true;
			}
			if (gameState.opponentDeck?.hasRelevantCard(this.cards)) {
				this.debug &&
					console.debug(
						'hasRelevantCard',
						this.id,
						side,
						gameState.opponentDeck?.hasRelevantCard(this.cards),
					);
				return true;
			}
			if (!this.opponent.display(gameState, bgState)) {
				this.debug && console.debug('no display', this.id, side, this.opponent.display(gameState, bgState));
				return false;
			}
			if (!(this.opponent.cachedValue = this.opponent.value(gameState, bgState))) {
				this.debug && console.debug('value', this.id, side, this.opponent.cachedValue);
				return false;
			}
			this.debug && console.debug('returning true', this.id, side, this);
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
	): CounterInstance<T> | undefined {
		const sideObj = this[side];
		// Always not null here, as we already checked in isActive()
		const rawValue = sideObj?.cachedValue ?? sideObj?.value(gameState, bgState);
		const savedValue = sideObj?.savedValue;
		if (rawValue === savedValue) {
			this.debug && console.debug('[debug] returning saved instance', this.id, side, sideObj);
			return sideObj?.savedInstance;
		}

		// Get the image value
		const image = typeof this.image === 'string' ? this.image : this.image(gameState, side);
		const imageUrl = this.imageIcon ?? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${image}.jpg`;
		const result: CounterInstance<T> = {
			id: this.id,
			side: side,
			type: this.type,
			valueImg: this.valueImg
				? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.valueImg}.jpg`
				: undefined,
			image: imageUrl,
			tooltip: this.tooltip(side, gameState, allCards, bgState, countersUseExpandedView),
			value: this.valueImg ? null : this.formatValue(rawValue),
			cardTooltip: this.cardTooltip(side, gameState, bgState, rawValue),
		};
		this.debug && console.debug('[debug] emitting counter', this.id, side, result);
		if (sideObj) {
			sideObj.savedValue = rawValue;
			sideObj.savedInstance = result;
		}
		return result;
	}
}

export interface CounterInstance<T> {
	readonly id: CounterType;
	readonly side: 'player' | 'opponent';
	readonly type: 'hearthstone' | 'battlegrounds';
	readonly image: string;
	readonly tooltip: string | null;
	readonly value: string | number | undefined | null;
	readonly valueImg?: string;
	readonly cardTooltip?: readonly string[];
}
export const equalCounterInstance = (
	a: CounterInstance<any> | null | undefined,
	b: CounterInstance<any> | null | undefined,
): boolean => {
	if (a == null && b == null) {
		return true;
	}
	if (a == null || b == null) {
		return false;
	}
	if (a.id !== b.id) {
		return false;
	}
	if (a.side !== b.side) {
		return false;
	}
	if (a.type !== b.type) {
		return false;
	}
	if (a.value !== b.value) {
		return false;
	}
	if (a.image !== b.image) {
		return false;
	}
	if (a.tooltip !== b.tooltip) {
		return false;
	}
	return true;
};

export interface PlayerImplementation<T> {
	pref: keyof Preferences;
	display: (state: GameState, bgState: BattlegroundsState | null | undefined) => boolean;
	value: (state: GameState, bgState: BattlegroundsState | null | undefined) => T | null | undefined;
	savedValue?: T | null | undefined;
	savedInstance?: CounterInstance<T>;
	setting: {
		label: (i18n: ILocalizationService) => string;
		tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService) => string;
	};
	cachedValue?: T | null | undefined;
}
