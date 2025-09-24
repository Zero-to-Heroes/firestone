import { ComponentType } from '@angular/cdk/portal';
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsHeroTier, BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { BGS_HERO_SELECTION_DAILY_FREE_USES, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { VisualAchievement } from '../../../models/visual-achievement';
import { AdService } from '../../../services/ad.service';
import { BgsHeroSelectionTooltipComponent } from '../hero-selection/bgs-hero-selection-tooltip.component';
import {
	BattlegroundsTribeDetailsTooltipComponent,
	BgsTribesImpactDetails,
} from './battlegrounds-tribe-details-tooltip.component';

@Component({
	standalone: false,
	selector: 'bgs-hero-selection-overlay-info',
	styleUrls: [
		// '../../../../css/themes/battlegrounds-theme.scss',
		'./bgs-hero-selection-overlay-info.component.scss',
	],
	template: `
		<div class="info-container" *ngIf="_hero">
			<div class="element tiers-info scalable" *ngIf="showTierOverlay$ | async">
				<!-- <bgs-hero-stats-info-premium *ngIf="showPremiumBanner"></bgs-hero-stats-info-premium> -->
				<div class="values" *ngIf="!showPremiumBanner">
					<div class="free-uses-left" *ngIf="_freeUsesLeft" [helpTooltip]="freeUsesTooltip">
						{{ freeUsesText }}
					</div>
					<div class="item tier">
						<div class="text" [fsTranslate]="'battlegrounds.hero-selection.tier'"></div>
						<div class="value {{ tier?.toLowerCase() }}">
							{{ tier }}
						</div>
					</div>
					<div class="item average-position">
						<div class="text" [fsTranslate]="'battlegrounds.hero-selection.average-position'"></div>
						<div class="value">
							{{ averagePosition }}
						</div>
					</div>
					<div class="item pickrate">
						<div class="text" [fsTranslate]="'battlegrounds.hero-selection.pickrate'"></div>
						<div class="value">
							{{ pickrate }}
						</div>
					</div>
					<div
						class="item tribes-impact"
						componentTooltip
						[componentType]="tribeDetailsComponentType"
						[componentInput]="tribeDetailsTooltipInput"
					>
						<div class="text" [fsTranslate]="'battlegrounds.hero-selection.tribes-impact'"></div>
						<div class="value {{ tribesImpactCss }}">
							{{ tribesImpact }}
						</div>
					</div>
					<div class="item info-container">
						<div
							class="info"
							inlineSVG="assets/svg/info.svg"
							cachedComponentTooltip
							[componentType]="heroTooltipComponentType"
							[componentInput]="_hero"
						></div>
					</div>
				</div>
			</div>
			<div class="element achievements" *ngIf="showAchievementsOverlay$ | async">
				<div
					class="achievement"
					*ngFor="let achievement of achievementsToDisplay; let i = index; trackBy: trackByFn"
					[ngClass]="{ completed: achievement.completed }"
				>
					<div
						class="icon"
						inlineSVG="assets/svg/achievements/categories/hearthstone_game.svg"
						[helpTooltip]="achievement.text"
					></div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionOverlayInfoComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	tribeDetailsComponentType: ComponentType<BattlegroundsTribeDetailsTooltipComponent> =
		BattlegroundsTribeDetailsTooltipComponent;
	heroTooltipComponentType: ComponentType<BgsHeroSelectionTooltipComponent> = BgsHeroSelectionTooltipComponent;

	showTierOverlay$: Observable<boolean>;
	showAchievementsOverlay$: Observable<boolean>;

	_hero: BgsMetaHeroStatTierItem;
	achievementsToDisplay: readonly InternalAchievement[] = [];
	tier: BgsHeroTier;
	averagePosition: string;
	pickrate: string;
	tribesImpact: string;
	tribesImpactCss: string;
	tribeDetailsTooltipInput: BgsTribesImpactDetails;
	_freeUsesLeft: number;
	freeUsesText: string;
	freeUsesTooltip: string;

	@Input() set hero(value: BgsMetaHeroStatTierItem | null) {
		this._hero = value;
		this.tier = value?.tier;
		this.averagePosition = value?.averagePosition?.toFixed(2);
		this.pickrate = value?.pickrate == null ? '-' : (value.pickrate * 100).toFixed(1) + '%';
		const tribesImpactValue = !value?.tribesFilter?.length
			? null
			: (value?.tribeStats?.map((t) => t.impactAveragePosition).reduce((a, b) => a + b, 0) ?? 0);
		this.tribesImpact = tribesImpactValue == null ? '-' : tribesImpactValue.toFixed(2);
		this.tribesImpactCss = tribesImpactValue == null ? '' : tribesImpactValue < 0 ? 'better' : 'worse';
		// Build the tooltip that shows the impact of each tribe
		const allTribes = [...(value?.averagePositionDetails?.allTribesAveragePositionModifierDetails ?? [])]
			.sort((a, b) => a.impact - b.impact)
			.map((tribe) => ({
				...tribe,
				inGame: value.tribesFilter?.includes(tribe.tribe),
			}));
		this.tribeDetailsTooltipInput = {
			tribeImpacts: allTribes,
		};
		// console.debug('[bgs-hero-selection-overlay-info] setting hero', value, this.tribeDetailsTooltipInput);
	}

	@Input() set achievements(value: readonly VisualAchievement[]) {
		this.achievementsToDisplay = this.buildAchievements(value);
	}

	@Input() set freeUsesLeft(value: number) {
		this._freeUsesLeft = value;
		this.freeUsesText = this.i18n.translateString('battlegrounds.in-game.quests.free-uses-text', {
			value: value,
		});
		this.freeUsesTooltip = this.i18n.translateString('battlegrounds.in-game.quests.free-uses-tooltip', {
			max: BGS_HERO_SELECTION_DAILY_FREE_USES,
			left: value,
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() showPremiumBanner: boolean;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly ads: AdService,
		private readonly prefs: PreferencesService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.prefs);

		this.showTierOverlay$ = combineLatest([
			this.ads.enablePremiumFeatures$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsShowHeroSelectionTiers)),
		]).pipe(this.mapData(([premium, bgsShowHeroSelectionTiers]) => bgsShowHeroSelectionTiers));
		this.showAchievementsOverlay$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsShowHeroSelectionAchievements),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: InternalAchievement) {
		return index;
	}

	private buildAchievements(value: readonly VisualAchievement[]): readonly InternalAchievement[] {
		// console.debug('[bgs-hero-selection-overlay-info] building achievements', value?.length, value);
		return (
			value
				?.filter((ach) => ach)
				.map((ach) => ach.completionSteps)
				.reduce((a, b) => a.concat(b), [])
				.filter((step) => step)
				.map((step) => ({
					completed: !!step.numberOfCompletions,
					text: `${
						!!step.numberOfCompletions
							? this.i18n.translateString('battlegrounds.hero-selection.achievement-completed')
							: this.i18n.translateString('battlegrounds.hero-selection.achievement-missing')
					}: ${step.completedText}`,
				}))
				.sort((a, b) => {
					if (a.completed) {
						return 1;
					}
					if (b.completed) {
						return -1;
					}
					return 0;
				})
				.slice(0, 4) ?? []
		);
	}
}

interface InternalAchievement {
	readonly completed: boolean;
	readonly text: string;
}
