/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaQuestRewardStatTierItem } from '@firestone/battlegrounds/data-access';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'battlegrounds-meta-stats-quest-reward-info',
	styleUrls: [
		`./battlegrounds-meta-stats-quest-rewards-columns.scss`,
		`./battlegrounds-meta-stats-quest-reward-info.component.scss`,
	],
	template: `
		<div class="info">
			<div class="image" [cardTooltip]="rewardCardId">
				<img class="icon" [src]="icon" />
			</div>
			<div class="quest-details">
				<div class="name">{{ rewardName }}</div>
				<div class="data-points">
					<div class="global">
						{{ dataPoints }}
					</div>
				</div>
			</div>
			<div class="position">
				<div class="global">{{ averagePosition }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestRewardInfoComponent {
	@Input() set stat(value: BgsMetaQuestRewardStatTierItem) {
		this.rewardCardId = value.cardId;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.rewardName = value.name;
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale()),
		});
		this.averagePosition = value.averagePosition?.toFixed(2) ?? '-';
	}

	@Input() collapsed: boolean;

	rewardCardId: string;
	icon: string;
	rewardName: string;
	dataPoints: string;
	averagePosition: string;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	buildValue(value: number): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(0);
	}
}
