import { Injectable } from '@angular/core';
import { BgsQuestStats } from '@firestone-hs/bgs-global-stats';
import { GameType, SceneMode } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/constructed/common';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { deepEqual } from 'assert';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	distinctUntilChanged,
	filter,
	map,
	shareReplay,
	switchMap,
} from 'rxjs';
import { BgsQuestCardChoiceOption } from '../model/quests-in-game';
import { BG_USE_QUESTS } from './bgs-in-game-quests-guardian.service';

export const IN_GAME_RANK_FILTER = 50;

@Injectable()
export class BgsInGameQuestsService extends AbstractFacadeService<BgsInGameQuestsService> {
	public showWidget$$: BehaviorSubject<boolean | null>;
	public questStats$$: BehaviorSubject<readonly BgsQuestCardChoiceOption[] | null>;

	private scene: SceneService;
	private prefs: PreferencesService;
	private gameState: GameStateFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsInGameQuestsService', () => !!this.showWidget$$);
	}

	protected override assignSubjects() {
		this.showWidget$$ = this.mainInstance.showWidget$$;
		this.questStats$$ = this.mainInstance.questStats$$;
	}

	protected async init() {
		this.showWidget$$ = new BehaviorSubject<boolean | null>(null);
		this.questStats$$ = new BehaviorSubject<readonly BgsQuestCardChoiceOption[] | null>(null);
		this.scene = AppInjector.get(SceneService);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameState = AppInjector.get(GameStateFacadeService);

		await Promise.all([this.scene.isReady(), this.prefs.isReady()]);

		const showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferencesSingle$((prefs) => prefs.overlayEnableDiscoverHelp),
			this.gameState.gameState$$.pipe(map((state) => state?.playerDeck?.currentOptions)),
			this.gameState.gameState$$.pipe(map((state) => state?.metadata?.gameType)),
		]).pipe(
			map(([currentScene, displayFromPrefs, currentOptions, gameType]) => {
				if (!displayFromPrefs || !BG_USE_QUESTS) {
					return false;
				}
				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}
				if (!currentOptions?.length) {
					return false;
				}
				if (!gameType || ![GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(gameType)) {
					return false;
				}
				return true;
			}),
		);

		const quests$: Observable<BgsQuestStats> = showWidget$.pipe(
			filter((show) => show),
			distinctUntilChanged(),
			switchMap(() => this.store.listenBattlegrounds$(([state]) => state?.currentGame?.hasQuests)),
			filter(([hasQuests]) => hasQuests),
			distinctUntilChanged(),
			switchMap(() =>
				this.store.listenBattlegrounds$(
					([state]) => state?.currentGame?.mmrAtStart,
					([state]) => state?.currentGame?.availableRaces,
				),
			),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			switchMap(([playerRank, availableRaces]) => {
				return this.quests.loadQuests('last-patch', IN_GAME_RANK_FILTER);
			}),
			// tap((info) => console.debug('[bgs-quest] quests', info)),
			this.mapData((quests) => {
				return quests;
			}),
			shareReplay(1),
		) as Observable<BgsQuestStats>;
	}
}
