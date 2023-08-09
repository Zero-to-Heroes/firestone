/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BgsMetaQuestStatTierItem } from '@firestone/battlegrounds/data-access';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'battlegrounds-meta-stats-quest-info',
	styleUrls: [
		`./battlegrounds-meta-stats-quests-columns.scss`,
		`./battlegrounds-meta-stats-quest-info.component.scss`,
	],
	template: `
		<div class="info" [ngClass]="{ clickable: difficultyItems?.length }" (click)="onClick()">
			<div class="image" [cardTooltip]="questCardId">
				<img class="icon" [src]="icon" />
			</div>
			<div class="quest-details" [helpTooltip]="questTooltip">
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
		<div class="items" *ngIf="difficultyItems?.length && !collapsed">
			<battlegrounds-meta-stats-quest-info
				class="item-container"
				*ngFor="let item of difficultyItems"
				[stat]="item"
			>
			</battlegrounds-meta-stats-quest-info>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestInfoComponent {
	@Output() statClicked: EventEmitter<BgsMetaQuestStatTierItem> = new EventEmitter<BgsMetaQuestStatTierItem>();

	@Input() set stat(value: BgsMetaQuestStatTierItem) {
		console.debug('setting stat', value);
		this._stat = value;
		this.questCardId = value.cardId;
		this.questTooltip =
			value.difficulty != null
				? this.i18n.translateString('app.battlegrounds.tier-list.quest-tooltip-with-difficulty', {
						questName: this.allCards.getCard(value.cardId).name,
						difficulty: value.difficulty,
				  })
				: this.i18n.translateString('app.battlegrounds.tier-list.quest-tooltip-all-difficulties', {
						questName: this.allCards.getCard(value.cardId).name,
				  });
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.questName = value.name;
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale()),
		});
		this.averageTurnsToComplete = value.averageTurnsToComplete?.toFixed(2) ?? '-';
		this.difficultyItems = value.difficultyItems;
	}

	@Input() collapsed: boolean;

	questCardId: string;
	questTooltip: string;
	icon: string;
	questName: string;
	dataPoints: string;
	averageTurnsToComplete: string;
	difficultyItems: readonly BgsMetaQuestStatTierItem[] = [];

	private _stat: BgsMetaQuestStatTierItem;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	buildValue(value: number): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(0);
	}

	onClick() {
		this.statClicked.next(this._stat);
	}
}
