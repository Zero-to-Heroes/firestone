import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';
import { groupByFunction } from '../../../services/utils';

@Component({
	selector: 'bgs-triples',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-triples.component.scss`,
	],
	template: `
		<div class="triples-section">
			<div class="title" *ngIf="tierTriples?.length">New triples</div>
			<div class="triple-tiers" *ngIf="tierTriples?.length">
				<div
					*ngFor="let triple of tierTriples || []; trackBy: trackByFn"
					class="triple"
					[helpTooltip]="
						'Since last fight, this opponent got ' +
						triple.quantity +
						' tier ' +
						getMinionTripleLevel(triple.minionTier) +
						' minions as rewards for tripling'
					"
				>
					<div class="number">x{{ triple.quantity }}</div>
					<tavern-level-icon
						[level]="getMinionTripleLevel(triple.minionTier)"
						class="tavern"
					></tavern-level-icon>
				</div>
			</div>
			<div class="subtitle" *ngIf="!tierTriples?.length">No new triple</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTriplesComponent {
	tierTriples: { minionTier: number; quantity: number }[];

	allTriples: readonly BgsTriple[];
	_boardTurn: number;

	@Input() set triples(value: readonly BgsTriple[]) {
		this.allTriples = value;
		this.filterTriples();
	}

	@Input() set boardTurn(value: number) {
		this._boardTurn = value;
		this.filterTriples();
	}

	getMinionTripleLevel(level: number): number {
		return Math.min(level + 1, 6);
	}

	trackByFn(index, item: { minionTier: number; quantity: number }) {
		return item.minionTier;
	}

	private filterTriples() {
		if (!this.allTriples || this._boardTurn == null) {
			return;
		}
		const triplesSinceLastBoard = this.allTriples.filter((triple) => triple.turn >= this._boardTurn);
		const groupedByTier = groupByFunction((triple: BgsTriple) => '' + triple.tierOfTripledMinion)(
			triplesSinceLastBoard,
		);
		this.tierTriples = Object.keys(groupedByTier).map((minionTier) => ({
			minionTier: parseInt(minionTier),
			quantity: groupedByTier[minionTier].length as number,
		}));
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
