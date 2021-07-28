import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsHeroSelectionOverviewPanel } from '../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroStat, BgsHeroTier } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../../models/battlegrounds/stats/bgs-stats';
import { VisualAchievement } from '../../../models/visual-achievement';
import { AdService } from '../../../services/ad.service';
import { getAchievementsForHero, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { groupByFunction } from '../../../services/utils';

@Component({
	selector: 'bgs-hero-selection-overview',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-overview.component.scss`,
	],
	template: `
		<div class="container" [ngClass]="{ 'no-ads': !showAds }">
			<div class="left">
				<bgs-hero-tier *ngFor="let tier of tiers || []; trackBy: trackByTierFn" [tier]="tier"></bgs-hero-tier>
			</div>
			<div class="hero-selection-overview">
				<bgs-hero-overview
					*ngFor="let hero of heroOverviews || []; trackBy: trackByHeroFn"
					[hero]="hero"
					[globalStats]="globalStats"
					[patchNumber]="patchNumber"
					[achievements]="hero?.achievements"
					[style.width.%]="getOverviewWidth()"
				></bgs-hero-overview>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionOverviewComponent {
	heroOverviews: InternalBgsHeroStat[];
	smallOverviews: readonly BgsHeroStat[];
	tiers: { tier: BgsHeroTier; heroes: readonly BgsHeroStat[] }[] = [];
	patchNumber: number;
	globalStats: BgsStats;
	showAds = true;

	private _panel: BgsHeroSelectionOverviewPanel;
	private _showAchievements: boolean;

	@Input() set showAchievements(value: boolean) {
		// console.debug('showing achievements', this._showAchievements, value);
		if (value === this._showAchievements) {
			return;
		}
		this._showAchievements = value;
		this.updateInfos();
	}

	@Input() set panel(value: BgsHeroSelectionOverviewPanel) {
		if (value === this._panel) {
			return;
		}
		if (!value?.heroOverview) {
			return;
		}
		// console.log('setting panel', value, this._panel);
		this._panel = value;
		this.updateInfos();
	}

	private updateInfos() {
		if (!this._panel) {
			return;
		}

		this.globalStats = this._panel.globalStats;
		this.patchNumber = this._panel.patchNumber;
		const allOverviews = this._panel.heroOverview.filter((overview) => overview.id !== 'average');
		const groupingByTier = groupByFunction((overview: BgsHeroStat) => overview.tier);
		const groupedByTier: BgsHeroStat[][] = Object.values(groupingByTier(allOverviews));
		// When spectating a game, we don't have the initial options
		const selectionOptions =
			this._panel?.heroOptionCardIds ??
			(this._panel.selectedHeroCardId ? [this._panel.selectedHeroCardId] : null);
		if (!selectionOptions || !groupedByTier) {
			return;
		}
		this.tiers = [
			{
				tier: 'S' as BgsHeroTier,
				heroes: groupedByTier
					.find((heroes) => heroes.find((hero) => hero.tier === 'S'))
					?.sort((a, b) => a.averagePosition - b.averagePosition),
			},
			{
				tier: 'A' as BgsHeroTier,
				heroes: groupedByTier
					.find((heroes) => heroes.find((hero) => hero.tier === 'A'))
					?.sort((a, b) => a.averagePosition - b.averagePosition),
			},
			{
				tier: 'B' as BgsHeroTier,
				heroes: groupedByTier
					.find((heroes) => heroes.find((hero) => hero.tier === 'B'))
					?.sort((a, b) => a.averagePosition - b.averagePosition),
			},
			{
				tier: 'C' as BgsHeroTier,
				heroes: groupedByTier
					.find((heroes) => heroes.find((hero) => hero.tier === 'C'))
					?.sort((a, b) => a.averagePosition - b.averagePosition),
			},
			{
				tier: 'D' as BgsHeroTier,
				heroes: groupedByTier
					.find((heroes) => heroes.find((hero) => hero.tier === 'D'))
					?.sort((a, b) => a.averagePosition - b.averagePosition),
			},
		].filter((tier) => tier.heroes);
		// console.log('setting hero overviews', this._panel);
		this.heroOverviews = selectionOptions.map((cardId) => {
			const normalized = normalizeHeroCardId(cardId, true);
			const existingStat = this._panel.heroOverview.find((overview) => overview.id === normalized);
			const statWithDefault =
				existingStat ||
				BgsHeroStat.create({
					id: cardId,
					tribesStat: [] as readonly { tribe: string; percent: number }[],
				} as BgsHeroStat);
			const achievementsForHero: readonly VisualAchievement[] = this._showAchievements
				? getAchievementsForHero(normalized, this._panel.heroAchievements, this.allCards)
				: [];
			// console.debug('achievementsForHero', achievementsForHero, this._showAchievements);
			return {
				...statWithDefault,
				id: cardId,
				name: this.allCards.getCard(cardId)?.name,
				baseCardId: normalized,
				achievements: achievementsForHero,
			};
		});
		console.debug('hero overviews', this.heroOverviews);

		if (this.heroOverviews.length === 2) {
			this.heroOverviews = [null, ...this.heroOverviews, null];
		} else if (this.heroOverviews.length === 3) {
			this.heroOverviews = [...this.heroOverviews, null];
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ads: AdService,
		private readonly allCards: AllCardsService,
	) {
		this.init();
	}

	getOverviewWidth(): number {
		return 24;
	}

	isAvailableHero(hero: BgsHeroStat): boolean {
		return this.heroOverviews.map((h) => h.id).indexOf(hero.id) !== -1;
	}

	trackByTierFn(index, item: { tier: BgsHeroTier; heroes: readonly BgsHeroStat[] }) {
		return item.tier;
	}

	trackByHeroFn(index, item: BgsHeroStat) {
		return item?.id;
	}

	private async init() {
		this.showAds = await this.ads.shouldDisplayAds();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface InternalBgsHeroStat extends BgsHeroStat {
	readonly achievements: readonly VisualAchievement[];
}
