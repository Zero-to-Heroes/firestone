/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject, sleep } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, debounceTime } from 'rxjs';
import { BattlegroundsState } from '../model/battlegrounds-state';
import { BgsMatchPlayersMmrService } from './bgs-match-players-mmr.service';

@Injectable()
export class BgsStateFacadeService extends AbstractFacadeService<BgsStateFacadeService> {
	public gameState$$: SubscriberAwareBehaviorSubject<BattlegroundsState | null>;

	private ow: OverwolfService;
	private matchPlayers: BgsMatchPlayersMmrService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsStateFacadeService', () => !!this.gameState$$);
	}

	protected override assignSubjects() {
		this.gameState$$ = this.mainInstance.gameState$$;
	}

	protected async init() {
		this.gameState$$ = new SubscriberAwareBehaviorSubject<BattlegroundsState | null>(null);
		this.ow = AppInjector.get(OverwolfService);
		this.matchPlayers = AppInjector.get(BgsMatchPlayersMmrService);

		while (!this.ow.getMainWindow().battlegroundsStore) {
			await sleep(50);
		}

		this.gameState$$.onFirstSubscribe(() => {
			const bgState: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
			combineLatest([bgState, this.matchPlayers.playersMatchMmr$$])
				.pipe(debounceTime(200))
				.subscribe(([state, playersMmr]) => {
					if (!state) {
						return;
					}
					if (!playersMmr?.length) {
						this.gameState$$.next(state);
						return;
					}

					const mergedState = state.update({
						currentGame: state.currentGame.update({
							players: state.currentGame.players.map((player) => {
								const playerMmr = playersMmr?.find((mmr) => mmr.playerId === player.playerId);
								return playerMmr
									? player.update({
											mmr: playerMmr.mmr,
											name: playerMmr.playerName ?? player.name,
									  })
									: player;
							}),
						}),
					});
					console.debug('[bgs-state-facade] updating state', mergedState);
					this.gameState$$.next(mergedState);
				});
		});
	}
}
