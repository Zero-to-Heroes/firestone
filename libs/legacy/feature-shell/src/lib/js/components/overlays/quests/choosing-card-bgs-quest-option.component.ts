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
import { DAILY_FREE_USES_HERO, IN_GAME_RANK_FILTER } from '@firestone/battlegrounds/common';
import { BgsQuestCardChoiceOption } from '@firestone/battlegrounds/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs';

@Component({
	selector: 'choosing-card-bgs-quest-option',
	styleUrls: ['./choosing-card-bgs-quest-option.component.scss'],
	template: `
		<div class="option">
			<div class="reward scalable">
				<div class="header" [helpTooltip]="rewardGlobalTooltip">
					<!-- <div class="tier">
                        {{ rewardTier }}
                    </div> -->
					<div
						class="text"
						[fsTranslate]="'battlegrounds.in-game.quests.reward.average-placement-header'"
					></div>
					<div class="sample-size">
						<div class="text" [fsTranslate]="'battlegrounds.in-game.quests.sample-size'"></div>
						<div class="value">{{ rewardDataPoints }}</div>
					</div>
				</div>
				<div class="free-uses-left" *ngIf="_freeUsesLeft" [helpTooltip]="freeUsesTooltip">
					{{ freeUsesText }}
				</div>
				<div class="values">
					<div
						class="item"
						[helpTooltip]="
							'battlegrounds.in-game.quests.reward.average-placement-global-tooltip' | fsTranslate
						"
					>
						<div
							class="text"
							[fsTranslate]="'battlegrounds.in-game.quests.reward.average-placement-global'"
						></div>
						<div class="value">
							{{ rewardAveragePositionGlobal }}
						</div>
					</div>
					<div class="item {{ rewardHeroCss }}" [helpTooltip]="rewardAveragePlacementHeroTooltip">
						<div
							class="text"
							[fsTranslate]="'battlegrounds.in-game.quests.reward.average-placement-hero'"
						></div>
						<div class="value">
							{{ rewardAveragePositionForHero }}
						</div>
					</div>
				</div>
			</div>
			<div class="quest scalable">
				<div class="header" [helpTooltip]="questHeaderTooltip">
					<div
						class="text"
						[fsTranslate]="'battlegrounds.in-game.quests.quest.turns-to-complete-header'"
					></div>
					<div class="sample-size">
						<div class="text" [fsTranslate]="'battlegrounds.in-game.quests.sample-size'"></div>
						<div class="value">{{ questDataPoints }}</div>
					</div>
				</div>
				<div class="values">
					<div
						class="item"
						[helpTooltip]="'battlegrounds.in-game.quests.quest.average-global-tooltip' | fsTranslate"
					>
						<div
							class="text"
							[fsTranslate]="'battlegrounds.in-game.quests.quest.average-global-header'"
						></div>
						<div class="value">
							{{ questTurnsToCompleteGlobal }}
						</div>
					</div>
					<div class="item {{ questDifficultyCss }}" [helpTooltip]="questDifficultyTooltip">
						<div
							class="text"
							[fsTranslate]="'battlegrounds.in-game.quests.quest.average-difficulty-header'"
						></div>
						<div class="value">
							{{ questTurnsToCompleteForDifficulty }}
						</div>
					</div>
					<div class="item {{ questHeroCss }}" [helpTooltip]="questHeroTooltip">
						<div
							class="text"
							[fsTranslate]="'battlegrounds.in-game.quests.quest.average-hero-header'"
						></div>
						<div class="value">
							{{ questTurnsToCompleteForHero }}
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardBgsQuestOptionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() set option(value: BgsQuestCardChoiceOption) {
		const loc = this.i18n.formatCurrentLocale();
		this.rewardAveragePositionGlobal = value.reward.averagePosition
			? value.reward.averagePosition.toLocaleString(loc, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
			  })
			: '-';
		this.rewardAveragePositionForHero = value.reward.averagePositionForHero
			? value.reward.averagePositionForHero.toLocaleString(loc, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
			  })
			: '-';
		this.rewardHeroCss =
			!value.reward.averagePositionForHero || value.reward.averagePositionForHero === value.reward.averagePosition
				? ''
				: value.reward.averagePositionForHero < value.reward.averagePosition
				? 'better'
				: 'worse';

		this.questTurnsToCompleteGlobal = value.quest.averageTurnsToComplete
			? value.quest.averageTurnsToComplete.toLocaleString(loc, {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
			  })
			: '-';
		this.questTurnsToCompleteForDifficulty = value.quest.averageTurnsToCompleteForDifficulty
			? value.quest.averageTurnsToCompleteForDifficulty.toLocaleString(loc, {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
			  })
			: '-';
		this.questDifficultyCss =
			!value.quest.averageTurnsToCompleteForDifficulty ||
			value.quest.averageTurnsToCompleteForDifficulty === value.quest.averageTurnsToComplete
				? ''
				: value.quest.averageTurnsToCompleteForDifficulty < value.quest.averageTurnsToComplete
				? 'better'
				: 'worse';
		this.questTurnsToCompleteForHero = value.quest.averageTurnsToCompleteForHero
			? value.quest.averageTurnsToCompleteForHero.toLocaleString(loc, {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
			  })
			: '-';
		this.questHeroCss =
			!value.quest.averageTurnsToCompleteForHero ||
			value.quest.averageTurnsToCompleteForHero === value.quest.averageTurnsToComplete
				? ''
				: value.quest.averageTurnsToCompleteForHero < value.quest.averageTurnsToComplete
				? 'better'
				: 'worse';
		this.rewardDataPoints = value.reward.dataPoints.toLocaleString(loc);
		this.questDataPoints = value.quest.dataPoints.toLocaleString(loc);

		this.rewardGlobalTooltip = this.i18n.translateString(
			'battlegrounds.in-game.quests.reward.average-placement-tooltip',
			{
				value: IN_GAME_RANK_FILTER,
			},
		);
		this.rewardAveragePlacementHeroTooltip = this.i18n.translateString(
			'battlegrounds.in-game.quests.reward.average-placement-hero-tooltip',
			{
				value: value.reward.heroDataPoints,
			},
		);
		this.questHeaderTooltip = this.i18n.translateString(
			'battlegrounds.in-game.quests.quest.turns-to-complete-header-tooltip',
			{
				value: IN_GAME_RANK_FILTER,
			},
		);
		this.questDifficultyTooltip = this.i18n.translateString(
			'battlegrounds.in-game.quests.quest.average-difficulty-tooltip',
			{
				value: value.quest.difficultyDataPoints,
			},
		);
		this.questHeroTooltip = this.i18n.translateString('battlegrounds.in-game.quests.quest.average-hero-tooltip', {
			value: value.quest.heroDataPoints,
		});
	}

	@Input() set freeUsesLeft(value: number) {
		this._freeUsesLeft = value;
		this.freeUsesText = this.i18n.translateString('battlegrounds.in-game.quests.free-uses-text', {
			value: value,
		});
		this.freeUsesTooltip = this.i18n.translateString('battlegrounds.in-game.quests.free-uses-tooltip', {
			max: DAILY_FREE_USES_HERO,
			left: value,
		});
		console.debug('set free users left', this._freeUsesLeft);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	rewardAveragePositionGlobal: string;
	rewardAveragePositionForHero: string;
	questTurnsToCompleteForDifficulty: string;
	questTurnsToCompleteGlobal: string;
	questTurnsToCompleteForHero: string;
	rewardDataPoints: string;
	questDataPoints: string;

	rewardGlobalTooltip: string;
	rewardAveragePlacementHeroTooltip: string;
	rewardHeroCss: string;
	questHeaderTooltip: string;
	questDifficultyTooltip: string;
	questDifficultyCss: string;
	questHeroTooltip: string;
	questHeroCss: string;

	_freeUsesLeft: number;
	freeUsesTooltip: string;
	freeUsesText: string;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

		this.prefs.preferences$$
			.pipe(
				this.mapData((prefs) => prefs.bgsQuestsOverlayScale),
				filter((pref) => !!pref),
				distinctUntilChanged(),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				const newScale = scale / 100;
				const elements = this.el.nativeElement.querySelectorAll('.scalable');
				elements.forEach((element) => this.renderer.setStyle(element, 'transform', `scale(${newScale})`));
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
