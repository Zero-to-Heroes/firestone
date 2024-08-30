import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import {
	BgsFaceOffWithSimulation,
	BgsPlayer,
	BgsTavernUpgrade,
	BgsTriple,
	QuestReward,
} from '@firestone/battlegrounds/common';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'bgs-opponent-overview-big',
	styleUrls: [`./bgs-opponent-overview-big.component.scss`],
	template: `
		<bgs-player-capsule
			[player]="_opponent"
			[displayTavernTier]="true"
			[showLastOpponentIcon]="showLastOpponentIcon"
			class="opponent-overview"
		>
			<div class="main-info">
				<bgs-board [entities]="boardMinions" [currentTurn]="currentTurn" [boardTurn]="boardTurn"></bgs-board>
				<div class="bottom-info">
					<bgs-triples [triples]="triples" [boardTurn]="boardTurn"></bgs-triples>
					<bgs-buddies
						[buddies]="buddies"
						[title]="buddiesTitle"
						*ngIf="buddiesEnabled && (showBuddiesIfEmpty || buddies?.length)"
					></bgs-buddies>
					<bgs-quest-rewards
						[rewards]="questRewards"
						*ngIf="showQuestRewardsIfEmpty || questRewards?.length"
					></bgs-quest-rewards>
					<bgs-trinkets [trinkets]="trinkets" *ngIf="trinkets?.length"></bgs-trinkets>
					<bgs-battle-status
						*ngIf="enableSimulation"
						[nextBattle]="nextBattle"
						[showReplayLink]="true"
					></bgs-battle-status>
				</div>
			</div>
			<div class="tavern-upgrades" *ngIf="showTavernsIfEmpty || tavernUpgrades?.length">
				<div class="title" *ngIf="tavernUpgrades?.length">{{ tavernTitle }}</div>
				<div class="upgrades" *ngIf="tavernUpgrades?.length">
					<div class="tavern-upgrade" *ngFor="let upgrade of tavernUpgrades || []; trackBy: trackByUpgradeFn">
						<tavern-level-icon [level]="upgrade.tavernTier" class="tavern"></tavern-level-icon>
						<div
							class="label"
							[owTranslate]="'battlegrounds.battle.turn'"
							[translateParams]="{ value: upgrade.turn }"
						></div>
					</div>
				</div>
				<div
					class="tavern-upgrades empty"
					*ngIf="!tavernUpgrades?.length"
					[owTranslate]="'battlegrounds.in-game.opponents.tavern-empty-state'"
				></div>
			</div>
		</bgs-player-capsule>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOpponentOverviewBigComponent {
	_opponent: BgsPlayer;
	boardMinions: readonly Entity[];
	boardTurn: number;
	tavernUpgrades: readonly BgsTavernUpgrade[];
	triples: readonly BgsTriple[];
	questRewards: readonly QuestReward[];
	trinkets: string[];
	buddies: readonly number[];

	@Input() rating: number;
	@Input() debug: boolean;
	@Input() enableSimulation: boolean;
	@Input() currentTurn: number;
	@Input() nextBattle: BgsFaceOffWithSimulation;
	@Input() maxBoardHeight = 1;
	@Input() tavernTitle = this.i18n.translateString('battlegrounds.in-game.opponents.tavern-upgrade-title');
	@Input() buddiesTitle: string;
	@Input() showTavernsIfEmpty = true;
	@Input() showBuddiesIfEmpty = true;
	@Input() showQuestRewardsIfEmpty = true;
	@Input() showLastOpponentIcon: boolean;
	@Input() buddiesEnabled: boolean;

	@Input() set opponent(value: BgsPlayer) {
		if (value === this._opponent) {
			return;
		}

		this._opponent = value;
		if (!value) {
			console.warn('[opponent-big] setting empty value');
			return;
		}

		this.boardMinions = value.getLastKnownBoardStateAsReplayEntities();
		this.boardTurn = value.getLastBoardStateTurn();
		this.triples = value.tripleHistory;
		this.questRewards = value.questRewards;
		this.trinkets = [];
		if (value.lesserTrinket) {
			this.trinkets.push(value.lesserTrinket);
		}
		if (value.greaterTrinket) {
			this.trinkets.push(value.greaterTrinket);
		}
		console.debug('trinkets', this.trinkets, value);
		this.buddies = value.buddyTurns;
		this.tavernUpgrades = value.tavernUpgradeHistory;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
