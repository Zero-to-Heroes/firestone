import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { BgsHeroSelectionOverview } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { Preferences } from '../../../models/preferences';
import { VisualAchievement } from '../../../models/visual-achievement';
import { getAchievementsForHero } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { CARDS_VERSION } from '../../../services/hs-utils';
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

	private _panel: BgsHeroSelectionOverview;
	private _showAchievements: boolean;

	private gameInfoUpdatedListener: (message: any) => void;
	private preferencesSubscription: Subscription;
	private storeSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private allCards: AllCardsService,
		private init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		// console.debug('init cards db', this.allCards, this.allCards?.initializeCardsDb);
		await this.allCards.initializeCardsDb(CARDS_VERSION);
		this.windowId = (await this.ow.getCurrentWindow()).id;

		const storeBus: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
		this.storeSubscription = storeBus.subscribe((newState: BattlegroundsState) => {
			if (!newState) {
				return;
			}

			const heroSelectionStage = newState?.stages?.find((stage) => stage.id === 'hero-selection');
			this._panel = heroSelectionStage?.panels?.find(
				(panel) => panel.id === 'bgs-hero-selection-overview',
			) as BgsHeroSelectionOverview;
			this.updateInfos();
		});

		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
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
			const existingStat = this._panel.heroOverview.find((overview) => overview.id === cardId);
			const statWithDefault =
				existingStat ||
				BgsHeroStat.create({
					id: cardId,
					tribesStat: [] as readonly { tribe: string; percent: number }[],
				} as BgsHeroStat);
			const achievementsForHero: readonly VisualAchievement[] = this._showAchievements
				? getAchievementsForHero(cardId, this._panel.heroAchievements, this.allCards)
				: [];
			return {
				...statWithDefault,
				achievements: achievementsForHero,
			};
		});
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
