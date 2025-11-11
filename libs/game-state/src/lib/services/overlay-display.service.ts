import { Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { GameStatusService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { GameStateFacadeService } from './game-state-facade.service';

const eventName = 'traditional-overlay-display';

@Injectable()
export class OverlayDisplayService extends AbstractFacadeService<OverlayDisplayService> {
	public decktrackerDisplayEventBus$$: BehaviorSubject<boolean>;

	private prefs: PreferencesService;
	private gameState: GameStateFacadeService;
	private gameStatus: GameStatusService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'OverlayDisplayService', () => !!this.decktrackerDisplayEventBus$$);
	}

	protected override assignSubjects() {
		this.decktrackerDisplayEventBus$$ = this.mainInstance.decktrackerDisplayEventBus$$;
	}

	protected async init() {
		this.decktrackerDisplayEventBus$$ = new BehaviorSubject<boolean>(false);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameState = AppInjector.get(GameStateFacadeService);
		this.gameStatus = AppInjector.get(GameStatusService);

		await waitForReady(this.prefs, this.gameState, this.gameStatus);

		combineLatest([this.gameState.gameState$$, this.prefs.preferences$$, this.gameStatus.inGame$$])
			.pipe(
				debounceTime(200),
				filter(([gameState, prefs, inGame]) => !!inGame),
				map(([gameState, prefs]) => ({
					gameType: gameState?.metadata?.gameType,
					hasPlayerDeck: true, // gameState?.playerDeck?.deckList?.length > 0,
					prefs: prefs,
				})),
				distinctUntilChanged((a, b) => {
					return (
						a.gameType === b.gameType &&
						a.hasPlayerDeck === b.hasPlayerDeck &&
						a.prefs.decktrackerShowArena === b.prefs.decktrackerShowArena &&
						a.prefs.decktrackerShowCasual === b.prefs.decktrackerShowCasual &&
						a.prefs.decktrackerShowRanked === b.prefs.decktrackerShowRanked &&
						a.prefs.decktrackerShowPractice === b.prefs.decktrackerShowPractice &&
						a.prefs.decktrackerShowFriendly === b.prefs.decktrackerShowFriendly &&
						a.prefs.decktrackerShowTavernBrawl === b.prefs.decktrackerShowTavernBrawl
					);
				}),
				map((info) => this.shouldDisplay(info.gameType, info.hasPlayerDeck, info.prefs)),
				distinctUntilChanged(),
				tap((info) => console.debug('[overlay-display] should display final value?', info)),
			)
			.subscribe((shouldDisplay) => this.decktrackerDisplayEventBus$$.next(shouldDisplay));
	}

	protected override initElectronSubjects() {
		this.setupElectronSubject(this.decktrackerDisplayEventBus$$, eventName);
	}

	protected override createElectronProxy(ipcRenderer: any) {
		this.decktrackerDisplayEventBus$$ = new BehaviorSubject<boolean>(false);
	}

	private shouldDisplay(gameType: GameType, hasPlayerDeck: boolean, prefs: Preferences): boolean {
		console.debug('[overlay-display] should display?', gameType, hasPlayerDeck, prefs.decktrackerShowPractice);
		if (!gameType || !hasPlayerDeck) {
			return false;
		}
		switch (gameType) {
			case GameType.GT_ARENA:
			case GameType.GT_UNDERGROUND_ARENA:
				return prefs.decktrackerShowArena;
			case GameType.GT_CASUAL:
				return prefs.decktrackerShowCasual;
			case GameType.GT_RANKED:
				return prefs.decktrackerShowRanked;
			case GameType.GT_VS_AI:
				return prefs.decktrackerShowPractice;
			case GameType.GT_VS_FRIEND:
				return prefs.decktrackerShowFriendly;
			case GameType.GT_FSG_BRAWL:
			case GameType.GT_FSG_BRAWL_1P_VS_AI:
			case GameType.GT_FSG_BRAWL_2P_COOP:
			case GameType.GT_FSG_BRAWL_VS_FRIEND:
			case GameType.GT_TB_1P_VS_AI:
			case GameType.GT_TB_2P_COOP:
			case GameType.GT_TAVERNBRAWL:
				return prefs.decktrackerShowTavernBrawl;
			case GameType.GT_BATTLEGROUNDS:
			case GameType.GT_BATTLEGROUNDS_FRIENDLY:
			case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
			case GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI:
			case GameType.GT_BATTLEGROUNDS_DUO:
			case GameType.GT_BATTLEGROUNDS_DUO_VS_AI:
			case GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY:
			case GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI:
				return false;
			case GameType.GT_MERCENARIES_AI_VS_AI:
			case GameType.GT_MERCENARIES_FRIENDLY:
			case GameType.GT_MERCENARIES_PVP:
			case GameType.GT_MERCENARIES_PVE:
			case GameType.GT_MERCENARIES_PVE_COOP:
				return false;
		}
		console.warn('[overlay-display] unknown game type', gameType as GameType);
		return hasPlayerDeck;
	}
}
