import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IN_GAME_RANK_FILTER } from '@firestone/battlegrounds/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BgsQuestCardChoiceOption } from './choosing-bgs-quest-widget-wrapper.component';

@Component({
	selector: 'choosing-card-bgs-quest-option',
	styleUrls: ['./choosing-card-bgs-quest-option.component.scss'],
	template: `
		<div class="option">
			<div class="reward">
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
					<div class="item" [helpTooltip]="rewardAveragePlacementHeroTooltip">
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
			<div class="quest">
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
					<div class="item" [helpTooltip]="questDifficultyTooltip">
						<div
							class="text"
							[fsTranslate]="'battlegrounds.in-game.quests.quest.average-difficulty-header'"
						></div>
						<div class="value">
							{{ questTurnsToCompleteForDifficulty }}
						</div>
					</div>
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
					<div class="item" [helpTooltip]="questHeroTooltip">
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
export class ChoosingCardBgsQuestOptionComponent {
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
		this.questTurnsToCompleteForDifficulty = value.quest.averageTurnsToCompleteForDifficulty
			? value.quest.averageTurnsToCompleteForDifficulty.toLocaleString(loc, {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
			  })
			: '-';
		this.questTurnsToCompleteGlobal = value.quest.averageTurnsToComplete
			? value.quest.averageTurnsToComplete.toLocaleString(loc, {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
			  })
			: '-';
		this.questTurnsToCompleteForHero = value.quest.averageTurnsToCompleteForHero
			? value.quest.averageTurnsToCompleteForHero.toLocaleString(loc, {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
			  })
			: '-';
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

	rewardAveragePositionGlobal: string;
	rewardAveragePositionForHero: string;
	questTurnsToCompleteForDifficulty: string;
	questTurnsToCompleteGlobal: string;
	questTurnsToCompleteForHero: string;
	rewardDataPoints: string;
	questDataPoints: string;

	rewardGlobalTooltip: string;
	rewardAveragePlacementHeroTooltip: string;
	questHeaderTooltip: string;
	questDifficultyTooltip: string;
	questHeroTooltip: string;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}
}
