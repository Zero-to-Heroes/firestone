import { Injectable } from '@angular/core';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import { BgsPanelId, GameStateFacadeService } from '@firestone/game-state';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector, IWindowHandlerService, WINDOW_HANDLER_SERVICE_TOKEN, WindowManagerService
} from '@firestone/shared/framework/core';
import { auditTime, BehaviorSubject, distinctUntilChanged, filter, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BgsInGameWindowNavigationService extends AbstractFacadeService<BgsInGameWindowNavigationService> {
	public currentPanelId$$: BehaviorSubject<BgsPanelId>;
	public forcedStatus$$: BehaviorSubject<'open' | 'closed' | null>;

	private prefs: PreferencesService;
	private windowHandler: IWindowHandlerService;
	private gameState: GameStateFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsInGameWindowNavigationService', () => !!this.currentPanelId$$);
	}

	protected override assignSubjects() {
		this.currentPanelId$$ = this.mainInstance.currentPanelId$$;
		this.forcedStatus$$ = this.mainInstance.forcedStatus$$;
	}

	public async toggleWindow() {
		this.forcedStatus$$.next(this.forcedStatus$$.value === 'open' ? 'closed' : 'open');
	}

	protected async init() {
		this.currentPanelId$$ = new BehaviorSubject<BgsPanelId>('bgs-hero-selection-overview');
		this.forcedStatus$$ = new BehaviorSubject<'open' | 'closed' | null>(null);
		this.prefs = AppInjector.get(PreferencesService);
		this.windowHandler = AppInjector.get(WINDOW_HANDLER_SERVICE_TOKEN);
		this.gameState = AppInjector.get(GameStateFacadeService);

		this.forcedStatus$$.pipe(distinctUntilChanged()).subscribe(async (forcedStatus) => {
			if (forcedStatus === null) {
				return;
			}

			const prefs: Preferences = await this.prefs.getPreferences();
			const bgsActive = prefs.bgsEnableApp && prefs.bgsFullToggle;
			if (!bgsActive) {
				return;
			}

			this.windowHandler.toggleBattlegroundsWindow(prefs.bgsUseOverlay, {
				forced: forcedStatus,
				canBringUpFromMinimized: false,
			});
		});

		this.gameState.gameState$$.pipe(
			auditTime(1000),
			filter(gameState => isBattlegrounds(gameState?.metadata.gameType)),
			map(gameState => gameState.gameStarted && !gameState.gameEnded),
			distinctUntilChanged()
		).subscribe(async (maybeShowHeroSelectionScreen) => {
			const prefs = await this.prefs.getPreferences();
			if (!maybeShowHeroSelectionScreen) {
				return;
			}

			this.currentPanelId$$.next('bgs-hero-selection-overview');
			this.forcedStatus$$.next(prefs.bgsShowHeroSelectionScreen ? 'open' : null);
		});
	}
}
