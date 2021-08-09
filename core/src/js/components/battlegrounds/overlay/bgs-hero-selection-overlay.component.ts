import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { BgsHeroSelectionOverviewPanel } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { Preferences } from '../../../models/preferences';
import { VisualAchievement } from '../../../models/visual-achievement';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'bgs-hero-selection-overlay',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/themes/battlegrounds-theme.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-hero-selection-overlay.component.scss',
	],
	template: `
		<div class="app-container overlay-container-parent battlegrounds-theme bgs-hero-selection-overlay">
			<bgs-hero-overview
				*ngFor="let hero of heroOverviews || []; trackBy: trackByHeroFn"
				[hero]="hero"
				[achievements]="hero?.achievements"
				[hideEmptyState]="true"
			></bgs-hero-overview>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionOverlayComponent implements AfterViewInit, OnDestroy {
	windowId: string;
	heroOverviews: InternalBgsHeroStat[];

	private _panel: BgsHeroSelectionOverviewPanel;
	private _showAchievements: boolean;

	private gameInfoUpdatedListener: (message: any) => void;
	private preferencesSubscription: Subscription;
	private storeSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private allCards: CardsFacadeService,
		private init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;

		const storeBus: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
		this.storeSubscription = storeBus.subscribe((newState: BattlegroundsState) => {
			if (!newState) {
				return;
			}

			this._panel = newState?.panels?.find(
				(panel) => panel.id === 'bgs-hero-selection-overview',
			) as BgsHeroSelectionOverviewPanel;
			this.updateInfos();
		});

		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.setDisplayPreferences(event.preferences);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});

		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
			}
		});
		this.setDisplayPreferences(await this.prefs.getPreferences());
		await this.changeWindowSize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.preferencesSubscription?.unsubscribe();
		this.storeSubscription?.unsubscribe();
	}

	trackByHeroFn(index, item: BgsHeroStat) {
		return item?.id;
	}

	private updateInfos() {
		if (!this._panel?.heroOptionCardIds?.length) {
			return;
		}

		this.heroOverviews = this._panel.heroOptionCardIds.map((cardId) => {
			const normalized = normalizeHeroCardId(cardId, true);
			const existingStat = this._panel.heroOverview.find((overview) => overview.id === normalized);
			const statWithDefault =
				existingStat ||
				BgsHeroStat.create({
					id: normalized,
					tribesStat: [] as readonly { tribe: string; percent: number }[],
				} as BgsHeroStat);
			const achievementsForHero: readonly VisualAchievement[] = this._showAchievements
				? getAchievementsForHero(normalized, this._panel.heroAchievements, this.allCards)
				: [];
			return {
				...statWithDefault,
				achievements: achievementsForHero,
			};
		});
		// console.debug('built hero overviews', this.heroOverviews);
		if (this.heroOverviews.length === 2) {
			this.heroOverviews = [null, ...this.heroOverviews, null];
		} else if (this.heroOverviews.length === 3) {
			this.heroOverviews = [...this.heroOverviews, null];
		}

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private setDisplayPreferences(preferences: Preferences) {
		if (!preferences) {
			return;
		}

		this._showAchievements = preferences.bgsShowHeroSelectionAchievements;
		this.updateInfos();
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const height = gameHeight * 0.5;
		const width = gameHeight * 1.1;
		await this.ow.changeWindowSize(this.windowId, width, height);
		const dpi = gameInfo.logicalWidth / gameWidth;
		const newLeft = dpi * 0.5 * (gameWidth - width);
		const newTop = dpi * 0.3 * gameHeight;
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}
}

interface InternalBgsHeroStat extends BgsHeroStat {
	readonly achievements: readonly VisualAchievement[];
}
