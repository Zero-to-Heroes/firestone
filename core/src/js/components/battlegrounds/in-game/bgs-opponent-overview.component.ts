import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';
import { groupByFunction } from '../../../services/utils';
import { OpponentInfo } from './opponent-info';

declare let amplitude: any;

@Component({
	selector: 'bgs-opponent-overview',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-opponent-overview.component.scss`,
	],
	template: `
		<div class="opponent-overview">
			<div class="portrait">
				<bgs-hero-portrait
					class="icon"
					[icon]="_opponentInfo.icon"
					[health]="_opponentInfo.health"
					[maxHealth]="_opponentInfo.maxHealth"
					[cardTooltip]="_opponentInfo.heroPowerCardId"
					[cardTooltipText]="_opponentInfo.name"
					[cardTooltipClass]="'bgs-hero-power'"
				></bgs-hero-portrait>
				<!-- <div class="name">{{ _opponentInfo.name }}</div> -->
				<tavern-level-icon [level]="_opponentInfo.tavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="main-info">
				<bgs-board
					[entities]="_opponentInfo.boardMinions"
					[currentTurn]="currentTurn"
					[boardTurn]="_opponentInfo.boardTurn"
					[tooltipPosition]="'top'"
				></bgs-board>
			</div>
			<div class="triples-section">
				<div class="title" *ngIf="tierTriples?.length">New triples</div>
				<div class="triple-tiers" *ngIf="tierTriples?.length">
					<div
						*ngFor="let triple of tierTriples"
						class="triple"
						[helpTooltip]="
							'That player got ' +
							triple.quantity +
							' tier ' +
							triple.minionTier +
							' minions since last time you fought them'
						"
					>
						<div class="number">x{{ triple.quantity }}</div>
						<tavern-level-icon [level]="triple.minionTier" class="tavern"></tavern-level-icon>
					</div>
				</div>
				<div class="subtitle" *ngIf="!tierTriples?.length">No new triple since the last encounter</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOpponentOverviewComponent {
	tierTriples: { minionTier: number; quantity: number }[];
	_opponentInfo: OpponentInfo;

	@Input() currentTurn: number;

	@Input() set opponentInfo(value: OpponentInfo) {
		this._opponentInfo = value;
		const triplesSinceLastBoard = value.triples.filter(triple => triple.turn >= value.boardTurn);
		const groupedByTier = groupByFunction((triple: BgsTriple) => '' + triple.tierOfTripledMinion)(
			triplesSinceLastBoard,
		);
		this.tierTriples = Object.keys(groupedByTier).map(minionTier => ({
			minionTier: parseInt(minionTier),
			quantity: groupedByTier[minionTier].length as number,
		}));
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	toggleDisplayBody(opponentInfo: OpponentInfo) {
		opponentInfo.displayBody = !opponentInfo.displayBody;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
