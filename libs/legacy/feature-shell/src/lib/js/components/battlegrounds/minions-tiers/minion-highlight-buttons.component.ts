import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService } from '@firestone/battlegrounds/common';
import { OverwolfService } from '@firestone/shared/framework/core';
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
			<ng-container *ngIf="!hideMechanicsHighlight">
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
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsHighlightButtonsComponent {
	@Input() minion: Minion;
	@Input() hideMechanicsHighlight: boolean;

	constructor(private readonly ow: OverwolfService, private readonly highlighter: BgsBoardHighlighterService) {}

	highlightMinion(minion: Minion) {
		this.highlighter.toggleMinionsToHighlight([minion.cardId]);
	}

	highlightBattlecry() {
		this.highlighter.toggleMechanicsToHighlight([GameTag.BATTLECRY]);
	}

	highlightDeathrattle() {
		this.highlighter.toggleMechanicsToHighlight([GameTag.DEATHRATTLE]);
	}

	highlightEndOfTurn() {
		this.highlighter.toggleMechanicsToHighlight([GameTag.END_OF_TURN]);
	}

	highlightTaunt() {
		this.highlighter.toggleMechanicsToHighlight([GameTag.TAUNT]);
	}

	highlightDivineShield() {
		this.highlighter.toggleMechanicsToHighlight([GameTag.DIVINE_SHIELD]);
	}

	highlightReborn() {
		this.highlighter.toggleMechanicsToHighlight([GameTag.REBORN]);
	}

	highlightBgSpell() {
		this.highlighter.toggleMechanicsToHighlight([GameTag.BG_SPELL]);
	}

	trackByFn(index: number, minion: Minion) {
		return minion.cardId;
	}
}
