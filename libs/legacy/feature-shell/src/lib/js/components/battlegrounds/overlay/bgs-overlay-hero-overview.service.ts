import { Injectable } from '@angular/core';
import { BgsPlayer, GameStateFacadeService } from '@firestone/game-state';
import { CardMousedOverService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BgsOverlayHeroOverviewService {
	// TODO: check usage, and whether having a full BgsPLayer is necessary
	public info$$ = new BehaviorSubject<PlayerInfo | null>(null);

	constructor(
		private readonly gameState: GameStateFacadeService,
		private readonly mouseOver: CardMousedOverService,
		private readonly prefs: PreferencesService,
	) {
		this.init();
	}

	private async init() {
		await waitForReady(this.gameState, this.prefs);

		this.gameState.gameState$$
			.pipe(
				map((state) => state?.gameEnded),
				distinctUntilChanged(),
			)
			.subscribe((gameEnded) => {
				if (gameEnded) {
					this.hideInfo(null);
				}
			});

		const players$ = this.gameState.gameState$$.pipe(
			debounceTime(100),
			map((state) => state.bgState.currentGame?.players),
			distinctUntilChanged(),
		);
		const componentClass$ = this.prefs.preferences$$.pipe(
			map((prefs) => (prefs.bgsOpponentOverlayAtTop ? null : 'bottom')),
			distinctUntilChanged(),
		);
		const lastOpponentPlayerId$ = this.gameState.gameState$$.pipe(
			map((state) => state.bgState.currentGame?.lastOpponentPlayerId),
			distinctUntilChanged(),
		);
		const currentTurn$ = this.gameState.gameState$$.pipe(
			map((state) => state.currentTurnNumeric),
			distinctUntilChanged(),
		);
		const config$ = this.gameState.gameState$$.pipe(
			map((state) => ({
				hasBuddies: state.bgState.currentGame?.hasBuddies,
				hasQuests: state.bgState.currentGame?.hasQuests,
			})),
			distinctUntilChanged((a, b) => a?.hasBuddies === b?.hasBuddies && a?.hasQuests === b?.hasQuests),
		);
		const pref$ = this.prefs.preferences$$.pipe(
			map((prefs) => prefs.bgsEnableOpponentBoardMouseOver),
			distinctUntilChanged(),
		);
		combineLatest([
			pref$,
			players$,
			lastOpponentPlayerId$,
			currentTurn$,
			config$,
			this.mouseOver.mousedOverCard$$,
			componentClass$,
		])
			.pipe(
				map(([pref, players, lastOpponentPlayerId, currentTurn, config, card, componentClass]) => {
					if (!players || !card || !pref) {
						return null;
					}
					const player = players.find((player) => player.playerId === card.PlayerId);
					const data: PlayerInfo = {
						player: player,
						additionalClasses: componentClass,
						isLastOpponent: player?.playerId === lastOpponentPlayerId,
						currentTurn: currentTurn,
						config: config,
					};
					return data;
				}),
			)
			.subscribe((data) => {
				if (data?.player) {
					this.showInfo(data);
				} else {
					this.hideInfo(data);
				}
			});
	}

	public showInfo(info: PlayerInfo | null) {
		this.info$$.next(info);
	}
	public hideInfo(info: PlayerInfo | null) {
		if (!info || this.info$$.value?.player?.playerId === info?.player?.playerId) {
			this.info$$.next(null);
		}
	}
}

export interface PlayerInfo {
	player: BgsPlayer;
	config: {
		hasBuddies: boolean;
		hasQuests: boolean;
	};
	currentTurn: number;
	isLastOpponent: boolean;
	additionalClasses: string;
}
