import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { BgsToggleHighlightMechanicsOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-mechanics-on-board-event';
import { BgsToggleHighlightMinionOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-minion-on-board-event';
import { Minion } from './bgs-minion-item.component';

@Component({
	selector: 'minion-highlight-buttons',
	styleUrls: [`./minion-highlight-buttons.component.scss`],
	template: `
		<div class="highlight-buttons">
			<div
				class="highlight-minion-button"
				[ngClass]="{ highlighted: minion.highlighted }"
				inlineSVG="assets/svg/pinned.svg"
				(click)="highlightMinion(minion)"
				[helpTooltip]="minion.hightMinionTooltip"
				[helpTooltipPosition]="'left'"
			></div>
			<div
				class="highlight-minion-button battlecry"
				*ngIf="minion.hasBattlecry"
				[ngClass]="{ highlighted: minion.battlecryHighlight }"
				(click)="highlightBattlecry()"
				[helpTooltip]="minion.highlightBattlecryTooltip"
			>
				<span class="label">B</span>
			</div>
			<div
				class="highlight-minion-button deathrattle"
				*ngIf="minion.hasDeathrattle"
				[ngClass]="{ highlighted: minion.deathrattleHighlight }"
				(click)="highlightDeathrattle()"
				[helpTooltip]="minion.highlightDeathrattleTooltip"
			>
				<span class="label">D</span>
			</div>
			<div
				class="highlight-minion-button taunt"
				*ngIf="minion.hasTaunt"
				[ngClass]="{ highlighted: minion.tauntHighlight }"
				(click)="highlightTaunt()"
				[helpTooltip]="minion.highlightTauntTooltip"
			>
				<span class="label">T</span>
			</div>
			<div
				class="highlight-minion-button divine-shield"
				*ngIf="minion.hasDivineShield"
				[ngClass]="{ highlighted: minion.divineShieldHighlight }"
				(click)="highlightDivineShield()"
				[helpTooltip]="minion.divineShieldHighlightTooltip"
			>
				<span class="label">DS</span>
			</div>
			<div
				class="highlight-minion-button end-of-turn"
				*ngIf="minion.hasEndOfTurn"
				[ngClass]="{ highlighted: minion.endOfTurnHighlight }"
				(click)="highlightEndOfTurn()"
				[helpTooltip]="!minion.endOfTurnHighlightTooltip"
			>
				<span class="label">E</span>
			</div>
			<div
				class="highlight-minion-button reborn"
				*ngIf="minion.hasReborn"
				[ngClass]="{ highlighted: minion.rebornHighlight }"
				(click)="highlightReborn()"
				[helpTooltip]="!minion.rebornHighlightTooltip"
			>
				<span class="label">R</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsHighlightButtonsComponent implements AfterViewInit {
	@Input() minion: Minion;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow())?.battlegroundsUpdater;
	}

	highlightMinion(minion: Minion) {
		this.battlegroundsUpdater.next(new BgsToggleHighlightMinionOnBoardEvent([minion.cardId]));
	}

	highlightBattlecry() {
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.BATTLECRY));
	}

	highlightDeathrattle() {
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.DEATHRATTLE));
	}

	highlightEndOfTurn() {
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.END_OF_TURN));
	}

	highlightTaunt() {
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.TAUNT));
	}

	highlightDivineShield() {
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.DIVINE_SHIELD));
	}

	highlightReborn() {
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.REBORN));
	}

	highlightBgSpell() {
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.BG_SPELL));
	}

	trackByFn(index: number, minion: Minion) {
		return minion.cardId;
	}
}
