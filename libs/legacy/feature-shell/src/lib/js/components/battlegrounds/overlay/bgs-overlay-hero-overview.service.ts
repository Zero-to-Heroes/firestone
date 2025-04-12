import { Injectable } from '@angular/core';
import { BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { BgsPlayer } from '@firestone/battlegrounds/core';
import { GameStateFacadeService } from '@firestone/game-state';
import { CardMousedOverService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BgsOverlayHeroOverviewService {
	// TODO: check usage, and whether having a full BgsPLayer is necessary
	public info$$ = new BehaviorSubject<PlayerInfo | null>(null);

	constructor(
		private readonly gameState: GameStateFacadeService,
		private readonly mouseOver: CardMousedOverService,
		private readonly bgState: BgsStateFacadeService,
		private readonly prefs: PreferencesService,
	) {
		this.init();
	}

	private async init() {
		await waitForReady(this.gameState, this.prefs, this.bgState);

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

		const players$ = this.bgState.gameState$$.pipe(
			debounceTime(100),
			map((state) => state?.currentGame?.players),
			// Immutable Map + a lot of info, maybe not use deepEqual
			// distinctUntilChanged((a, b) => deepEqual(a, b)),
		);
		const componentClass$ = this.prefs.preferences$$.pipe(
			map((prefs) => (prefs.bgsOpponentOverlayAtTop ? null : 'bottom')),
			distinctUntilChanged(),
		);
		const lastOpponentPlayerId$ = this.bgState.gameState$$.pipe(
			map((state) => state?.currentGame?.lastOpponentPlayerId),
			distinctUntilChanged(),
		);
		const currentTurn$ = this.bgState.gameState$$.pipe(
			map((state) => state?.currentGame?.currentTurn),
			distinctUntilChanged(),
		);
		const config$ = this.bgState.gameState$$.pipe(
			map((state) => ({
				hasBuddies: state?.currentGame?.hasBuddies,
				hasQuests: state?.currentGame?.hasQuests,
			})),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
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
