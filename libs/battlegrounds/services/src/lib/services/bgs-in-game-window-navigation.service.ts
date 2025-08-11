import { Injectable } from '@angular/core';
import { BgsPanelId } from '@firestone/game-state';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BgsInGameWindowNavigationService extends AbstractFacadeService<BgsInGameWindowNavigationService> {
	public currentPanelId$$: BehaviorSubject<BgsPanelId>;
	public forcedStatus$$: BehaviorSubject<'open' | 'closed' | null>;

	private prefs: PreferencesService;
	private ow: OverwolfService;

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
		this.ow = AppInjector.get(OverwolfService);

		this.forcedStatus$$.pipe(distinctUntilChanged()).subscribe(async (forcedStatus) => {
			if (forcedStatus === null) {
				return;
			}

			const prefs: Preferences = await this.prefs.getPreferences();
			const bgsActive = prefs.bgsEnableApp && prefs.bgsFullToggle;
			const windowId = prefs.bgsUseOverlay
				? OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY
				: OverwolfService.BATTLEGROUNDS_WINDOW;

			const battlegroundsWindow = await this.ow.getWindowState(windowId);
			if (!bgsActive) {
				return;
			}

			// Minimize is only triggered by a user action, so if they minimize it we don't touch it
			if (battlegroundsWindow.window_state_ex === 'minimized') {
				return;
			}

			if (forcedStatus === 'open') {
				await this.ow.obtainDeclaredWindow(windowId);
				if (
					battlegroundsWindow.window_state_ex !== 'maximized' &&
					battlegroundsWindow.stateEx !== 'maximized'
				) {
					await this.ow.restoreWindow(windowId);
					await this.ow.bringToFront(windowId);
				}
			} else if (forcedStatus === 'closed') {
				await this.ow.closeWindow(windowId);
			}
		});
	}
}
