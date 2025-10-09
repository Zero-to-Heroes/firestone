import { AfterViewInit, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { QuestReward } from '@firestone/battlegrounds/core';
import { BgsPlayer, BgsTavernUpgrade, BgsTriple } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'bgs-opponent-overview',
	styleUrls: [`./bgs-opponent-overview.component.scss`],
	template: `
		<div class="opponent-overview">
			<div class="portrait">
				<bgs-hero-portrait
					class="icon"
					[heroCardId]="heroCardId"
					[health]="health"
					[maxHealth]="maxHealth"
					[cardTooltip]="heroPowerCardId"
					[cardTooltipClass]="'bgs-hero-power'"
					[name]="name"
					[mmr]="mmr"
				></bgs-hero-portrait>
				<tavern-level-icon [level]="tavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="main-info">
				<bgs-board
					[entities]="boardMinions"
					[currentTurn]="currentTurn"
					[boardTurn]="boardTurn"
					[tooltipPosition]="'top'"
					[showBoardMessage]="showBoardMessage"
					[customTitle]="emptyBoardMessage"
				></bgs-board>
			</div>
			<div class="tavern-upgrades" *ngIf="showTavernUpgrades">
				<div
					class="title"
					*ngIf="tavernUpgrades?.length"
					[fsTranslate]="'battlegrounds.in-game.opponents.tavern-last-upgrade-title'"
				></div>
				<div class="upgrades" *ngIf="tavernUpgrades?.length">
					<div class="tavern-upgrade" *ngFor="let upgrade of tavernUpgrades || []; trackBy: trackByUpgradeFn">
						<tavern-level-icon [level]="upgrade.tavernTier" class="tavern"></tavern-level-icon>
						<div
							class="label"
							[fsTranslate]="'battlegrounds.battle.turn'"
							[translateParams]="{ value: upgrade.turn }"
						></div>
					</div>
				</div>
				<div
					class="subtitle"
					*ngIf="!tavernUpgrades?.length"
					[fsTranslate]="'battlegrounds.in-game.opponents.tavern-empty-state'"
				></div>
			</div>
			<bgs-buddies [buddies]="buddies" *ngIf="buddiesEnabled && showBuddies"></bgs-buddies>
			<bgs-quest-rewards [rewards]="questRewards" *ngIf="showQuestRewards"></bgs-quest-rewards>
			<bgs-triples [triples]="triples" [boardTurn]="boardTurn" *ngIf="showTriples"></bgs-triples>
			<bgs-trinkets [trinkets]="trinkets" *ngIf="showTrinkets"></bgs-trinkets>
			<div
				class="last-opponent-icon"
				*ngIf="showLastOpponentIcon"
				[helpTooltip]="'last-opponent-icon-tooltip' | fsTranslate"
				inlineSVG="assets/svg/last_opponent.svg"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOpponentOverviewComponent implements AfterViewInit {
	heroCardId: string;
	health: number;
	maxHealth: number;
	heroPowerCardId: string;
	name: string;
	mmr: number | null;
	tavernTier: number;
	boardMinions: readonly Entity[];
	boardTurn: number;
	tavernUpgrades: BgsTavernUpgrade[];
	triples: readonly BgsTriple[];
	questRewards: readonly QuestReward[];
	trinkets: string[];
	debug = false;
	buddies: readonly number[];

	@Input() showLastOpponentIcon: boolean;
	@Input() showTavernUpgrades = true;
	@Input() showBuddies = true;
	@Input() showQuestRewards = true;
	@Input() showTrinkets = true;
	@Input() showTriples = true;
	@Input() showBoardMessage = true;
	@Input() emptyBoardMessage: string;
	@Input() buddiesEnabled: boolean;

	@Input() currentTurn: number;

	@Input() set opponent(value: BgsPlayer) {
		if (value === this._opponent) {
			return;
		}
		this.debug = false; //value.cardId === 'TB_BaconShop_HERO_01';
		if (this.debug) {
		}
		this._opponent = value;
		if (!value) {
			console.warn('[opponent-overview] setting empty value');
			return;
		}
		this.heroCardId = value.getDisplayCardId();
		this.health = value.initialHealth + value.currentArmor - value.damageTaken;
		this.maxHealth = value.initialHealth;
		this.heroPowerCardId = value.getDisplayHeroPowerCardId(this.allCards);
		this.name = value.name;
		this.mmr = value.mmr;
		this.tavernTier = value.getCurrentTavernTier();
		this.boardMinions = value.getLastKnownBoardStateAsReplayEntities();
		this.boardTurn = value.getLastBoardStateTurn();
		this.tavernUpgrades = [...value.tavernUpgradeHistory].reverse();
		this.triples = value.tripleHistory;
		this.questRewards = value.questRewards;
		this.buddies = value.buddyTurns;
		this.trinkets = [];
		if (value.lesserTrinket) {
			this.trinkets.push(value.lesserTrinket);
		}
		if (value.greaterTrinket) {
			this.trinkets.push(value.greaterTrinket);
		}
	}

	private _opponent: BgsPlayer;

	constructor(private readonly allCards: CardsFacadeService) {}

	ngAfterViewInit() {
		if (this.debug) {
		}
	}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
