import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService } from '@firestone/battlegrounds/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Minion } from './bgs-minion-item.component';

@Component({
	standalone: false,
	selector: 'minion-highlight-buttons',
	styleUrls: [`./minion-highlight-buttons.component.scss`],
	template: `
		<div class="highlight-buttons">
			<div
				class="highlight-minion-button minion-pin"
				[ngClass]="{ highlighted: minion.highlighted }"
				inlineSVG="assets/svg/pinned.svg"
				(click)="highlightMinion(minion)"
				[helpTooltip]="minion.hightMinionTooltip"
				[helpTooltipPosition]="'left'"
			></div>
			<ng-container *ngIf="!hideMechanicsHighlight">
				<ng-container *ngFor="let highlight of minion.mechanicsHighlights">
					<div
						class="highlight-minion-button"
						*ngIf="highlight.hasMechanics"
						[ngClass]="{ highlighted: highlight.highlighted }"
						(click)="highlightMechanics(highlight.mechanic)"
						[helpTooltip]="highlight.tooltip"
					>
						<span class="label">{{ highlight.label }}</span>
					</div>
				</ng-container>
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

	highlightMechanics(mechanics: GameTag) {
		this.highlighter.toggleMechanicsToHighlight([mechanics]);
	}

	trackByFn(index: number, minion: Minion) {
		return minion.cardId;
	}
}
