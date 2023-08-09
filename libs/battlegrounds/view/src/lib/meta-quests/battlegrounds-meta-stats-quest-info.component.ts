/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaQuestStatTierItem } from '@firestone/battlegrounds/data-access';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'battlegrounds-meta-stats-quest-info',
	styleUrls: [
		`./battlegrounds-meta-stats-quests-columns.scss`,
		`./battlegrounds-meta-stats-quest-info.component.scss`,
	],
	template: `
		<div class="info">
			<div class="image">
				<img class="icon" [src]="icon" />
			</div>
			<div class="quest-details">
				<div class="name">{{ questName }}</div>
				<div class="data-points">
					<div class="global">
						{{ dataPoints }}
					</div>
				</div>
			</div>
			<div class="turns-to-complete">
				<div class="global">{{ averageTurnsToComplete }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestInfoComponent {
	@Input() set stat(value: BgsMetaQuestStatTierItem) {
		this.questCardId = value.cardId;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.questName = this.allCards.getCard(this.questCardId).name;
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale()),
		});

		this.averageTurnsToComplete = value.averageTurnsToComplete.toFixed(2);
	}

	questCardId: string;
	icon: string;
	questName: string;
	dataPoints: string;
	averageTurnsToComplete: string;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	buildValue(value: number): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(0);
	}
}
