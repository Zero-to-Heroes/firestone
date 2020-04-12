import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';
import { groupByFunction } from '../../../services/utils';
import { OpponentInfo } from './opponent-info';

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
			<div class="triple-tiers" *ngIf="tierTriples?.length > 0">
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
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTriplesComponent {
	tierTriples: { minionTier: number; quantity: number }[];

	@Input() set opponentInfo(value: OpponentInfo) {
		const triplesSinceLastBoard = value.triples.filter(triple => triple.turn >= value.boardTurn);
		const groupedByTier = groupByFunction((triple: BgsTriple) => '' + triple.tierOfTripledMinion)(
			triplesSinceLastBoard,
		);
		// See bgs-board
		// console.log(
		// 	'setting triples',
		// 	this.tierTriples,
		// 	Object.keys(groupedByTier).map(minionTier => ({
		// 		minionTier: parseInt(minionTier),
		// 		quantity: groupedByTier[minionTier].length as number,
		// 	})),
		// );
		this.tierTriples = [];
		setTimeout(() => {
			this.tierTriples = Object.keys(groupedByTier).map(minionTier => ({
				minionTier: parseInt(minionTier),
				quantity: groupedByTier[minionTier].length as number,
			}));
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	constructor(private readonly cdr: ChangeDetectorRef, private el: ElementRef, private renderer: Renderer2) {}
}
