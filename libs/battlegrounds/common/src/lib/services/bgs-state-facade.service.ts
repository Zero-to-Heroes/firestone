/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { sleep, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	OverwolfService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { auditTime, BehaviorSubject, combineLatest, tap } from 'rxjs';
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

		await waitForReady(this.matchPlayers);

		this.gameState$$.onFirstSubscribe(async () => {
			while (!this.ow.getMainWindow().battlegroundsStore) {
				await sleep(50);
			}
			const bgState: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
			combineLatest([bgState, this.matchPlayers.playersMatchMmr$$])
				.pipe(
					auditTime(200),
				)
				.subscribe(([state, playersMmr]) => {
					if (!state?.currentGame) {
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
					this.gameState$$.next(mergedState);
				});
		});
	}
}
