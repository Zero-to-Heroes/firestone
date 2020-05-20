import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';
import { groupByFunction } from '../../../services/utils';

declare let amplitude: any;

@Component({
	selector: 'bgs-triples',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-triples.component.scss`,
	],
	template: `
		<div class="triples-section">
			<div class="title" *ngIf="tierTriples?.length">New triples</div>
			<div class="triple-tiers">
				<div
					*ngFor="let triple of tierTriples || []; trackBy: trackByFn"
					class="triple"
					[helpTooltip]="
						'That player got ' +
						triple.quantity +
						' tier ' +
						(triple.minionTier + 1) +
						' minions since last time you fought them'
					"
				>
					<div class="number">x{{ triple.quantity }}</div>
					<tavern-level-icon [level]="triple.minionTier + 1" class="tavern"></tavern-level-icon>
				</div>
			</div>
			<div class="subtitle" *ngIf="!tierTriples?.length">No new triple since the last encounter</div>
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

	trackByFn(index, item: { minionTier: number; quantity: number }) {
		return item.minionTier;
	}

	private filterTriples() {
		if (!this.allTriples || this._boardTurn == null) {
			return;
		}
		const triplesSinceLastBoard = this.allTriples.filter(triple => triple.turn >= this._boardTurn);
		const groupedByTier = groupByFunction((triple: BgsTriple) => '' + triple.tierOfTripledMinion)(
			triplesSinceLastBoard,
		);
		// See bgs-board
		// this.tierTriples = [];
		// setTimeout(() => {
		this.tierTriples = Object.keys(groupedByTier).map(minionTier => ({
			minionTier: parseInt(minionTier),
			quantity: groupedByTier[minionTier].length as number,
		}));
		// 	if (!(this.cdr as ViewRef)?.destroyed) {
		// 		this.cdr.detectChanges();
		// 	}
		// });
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
