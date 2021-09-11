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
import { filter, map, tap } from 'rxjs/operators';
import { BgsHeroSelectionOverviewPanel } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { VisualAchievement } from '../../../models/visual-achievement';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreService } from '../../../services/ui-store/app-ui-store.service';

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
	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly store: AppUiStoreService,
		private readonly init_DebugService: DebugService,
	) {
		this.heroOverviews$ = combineLatest(
			this.store.bgHeroStats$(),
			this.store.listenBattlegrounds$(
				([main, prefs]) => main.panels,
				([main, prefs]) => prefs.bgsShowHeroSelectionAchievements,
			),
		).pipe(
			map(
				([stats, [panels, showAchievements]]) =>
					[
						stats,
						panels.find(
							(panel) => panel.id === 'bgs-hero-selection-overview',
						) as BgsHeroSelectionOverviewPanel,
						showAchievements,
					] as readonly [readonly BgsHeroStat[], BgsHeroSelectionOverviewPanel, boolean],
			),
			filter(([stats, panel, showAchievements]) => !!panel?.heroOptionCardIds?.length),
			map(([stats, panel, showAchievements]) => {
				const heroOverviews = panel?.heroOptionCardIds.map((cardId) => {
					const normalized = normalizeHeroCardId(cardId, true);
					const existingStat = stats.find((overview) => overview.id === normalized);
					const statWithDefault =
						existingStat ||
						BgsHeroStat.create({
							id: normalized,
						} as BgsHeroStat);
					const achievementsForHero: readonly VisualAchievement[] = showAchievements
						? getAchievementsForHero(normalized, panel.heroAchievements, this.allCards)
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
		);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
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
