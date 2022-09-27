import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsHeroStat, BgsHeroTier } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { VisualAchievement } from '../../../models/visual-achievement';
import { defaultStartingHp } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { BgsHeroSelectionTooltipComponent } from './bgs-hero-selection-tooltip.component';

@Component({
	selector: 'bgs-hero-overview',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-overview.component.scss`,
	],
	template: `
		<div class="hero-overview" *ngIf="_hero">
			<div class="name">{{ _hero.name }}</div>
			<div class="tier {{ tier?.toLowerCase() }}">
				<div class="tier-value">{{ tier }}</div>
			</div>
			<!-- Used only for the in-game overlay -->
			<div
				class="portrait-tooltip"
				cachedComponentTooltip
				[componentType]="componentType"
				[componentInput]="_hero"
				[componentTooltipPosition]="heroTooltipPosition"
				[componentTooltipCssClass]="tooltipAdditionalClass"
			></div>
			<div class="portrait-container">
				<bgs-hero-portrait
					class="portrait"
					[heroCardId]="_hero.id"
					[health]="health"
					[maxHealth]="health"
					[cardTooltip]="_hero.heroPowerCardId"
					[cardTooltipClass]="'bgs-hero-select'"
				></bgs-hero-portrait>
				<div class="achievements">
					<div
						class="achievement"
						*ngFor="let achievement of achievementsToDisplay; let i = index; trackBy: trackByFn"
						[ngClass]="{ 'completed': achievement.completed }"
					>
						<div
							class="icon"
							inlineSVG="assets/svg/achievements/categories/hearthstone_game.svg"
							[helpTooltip]="achievement.text"
						></div>
					</div>
				</div>
			</div>
			<bgs-hero-stats [hero]="_hero"></bgs-hero-stats>
		</div>
		<div class="hero-overview empty" *ngIf="!_hero && !hideEmptyState">
			<i class="placeholder">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
				</svg>
			</i>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroOverviewComponent {
	componentType: ComponentType<any> = BgsHeroSelectionTooltipComponent;

	@Input() hideEmptyState: boolean;
	@Input() heroTooltipPosition = 'right';
	@Input() tooltipAdditionalClass: string;

	_hero: BgsHeroStat;
	player: BgsPlayer;
	health: number;
	tier: BgsHeroTier;
	achievementsToDisplay: readonly InternalAchievement[] = [];

	@Input() set hero(value: BgsHeroStat) {
		this._hero = value;
		if (!value) {
			return;
		}

		this.health = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.baseCardId);
		this.player = BgsPlayer.create({
			cardId: value.baseCardId,
		} as BgsPlayer);
		this.tier = value.tier;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set achievements(value: readonly VisualAchievement[]) {
		if (!value) {
			return;
		}

		this.achievementsToDisplay = value
			.filter((ach) => ach)
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
			.slice(0, 4);
		if (!this.achievementsToDisplay?.length) {
			console.warn('could not find any achievements to display', value?.length, value);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef, private readonly i18n: LocalizationFacadeService) {}

	trackByFn(index, item: InternalAchievement) {
		return index;
	}
}

interface InternalAchievement {
	readonly completed: boolean;
	readonly text: string;
}
