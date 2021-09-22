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
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsHeroSelectionOverviewPanel } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { VisualAchievement } from '../../../models/visual-achievement';
import { VisualAchievementCategory } from '../../../models/visual-achievement-category';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreService, cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../services/utils';

@Component({
	selector: 'bgs-hero-selection-overlay',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/themes/battlegrounds-theme.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-hero-selection-overlay.component.scss',
	],
	template: `
		<div
			class="app-container overlay-container-parent battlegrounds-theme bgs-hero-selection-overlay"
			[ngClass]="{ 'with-hero-tooltips': heroTooltipActive$ | async }"
		>
			<bgs-hero-overview
				*ngFor="let hero of (heroOverviews$ | async) || []; trackBy: trackByHeroFn"
				[hero]="hero"
				[achievements]="hero?.achievements"
				[hideEmptyState]="true"
			></bgs-hero-overview>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionOverlayComponent implements AfterViewInit, OnDestroy {
	heroOverviews$: Observable<InternalBgsHeroStat[]>;
	heroTooltipActive$: Observable<boolean>;
	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly store: AppUiStoreService,
		private readonly init_DebugService: DebugService,
	) {
		this.heroTooltipActive$ = this.store
			.listen$(([main, nav, prefs]) => prefs.bgsShowHeroSelectionTooltip)
			.pipe(
				map(([pref]) => pref),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting heroTooltipActive in ', this.constructor.name, info)),
			);
		this.heroOverviews$ = combineLatest(
			this.store.bgHeroStats$(),
			this.store.listen$(([main, nav]) => main.achievements),
			this.store.listenBattlegrounds$(
				([main, prefs]) => main.panels,
				([main, prefs]) => prefs.bgsShowHeroSelectionAchievements,
			),
		).pipe(
			map(
				([stats, [achievements], [panels, showAchievements]]) =>
					[
						stats,
						achievements.findCategory('hearthstone_game_sub_13'),
						panels.find(
							(panel) => panel.id === 'bgs-hero-selection-overview',
						) as BgsHeroSelectionOverviewPanel,
						showAchievements,
					] as readonly [
						readonly BgsHeroStat[],
						VisualAchievementCategory,
						BgsHeroSelectionOverviewPanel,
						boolean,
					],
			),
			filter(([stats, heroesAchievementCategory, panel, showAchievements]) => !!panel?.heroOptionCardIds?.length),
			map(
				([stats, heroesAchievementCategory, panel, showAchievements]) =>
					[
						panel?.heroOptionCardIds ?? (panel.selectedHeroCardId ? [panel.selectedHeroCardId] : null),
						heroesAchievementCategory,
						stats,
						showAchievements,
					] as [readonly string[], VisualAchievementCategory, readonly BgsHeroStat[], boolean],
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(([selectionOptions, heroesAchievementCategory, stats, showAchievements]) => {
				const heroAchievements: readonly VisualAchievement[] = heroesAchievementCategory?.retrieveAllAchievements();
				const heroOverviews = selectionOptions.map((cardId) => {
					const normalized = normalizeHeroCardId(cardId, true);
					const existingStat = stats.find((overview) => overview.id === normalized);
					const statWithDefault = existingStat || BgsHeroStat.create({ id: normalized } as BgsHeroStat);
					const achievementsForHero: readonly VisualAchievement[] = showAchievements
						? getAchievementsForHero(normalized, heroAchievements, this.allCards)
						: [];
					return {
						...statWithDefault,
						id: cardId,
						name: this.allCards.getCard(cardId)?.name,
						baseCardId: normalized,
						achievements: achievementsForHero,
					};
				});
				if (heroOverviews.length === 2) {
					return [null, ...heroOverviews, null];
				} else if (heroOverviews.length === 3) {
					return [...heroOverviews, null];
				} else {
					return heroOverviews;
				}
			}),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((info) => cdLog('update hero selection overlay', this.constructor.name, info)),
		);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.ow.setWindowPassthrough(this.windowId);

		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
			}
		});
		await this.changeWindowSize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
	}

	trackByHeroFn(index, item: BgsHeroStat) {
		return item?.id;
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const height = gameHeight * 0.85;
		const width = gameHeight * 1.1;
		await this.ow.changeWindowSize(this.windowId, width, height);
		const dpi = gameInfo.logicalWidth / gameWidth;
		const newLeft = dpi * 0.5 * (gameWidth - width);
		const newTop = 0;
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}
}

interface InternalBgsHeroStat extends BgsHeroStat {
	readonly achievements: readonly VisualAchievement[];
}
