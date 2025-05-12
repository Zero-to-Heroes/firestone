import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsTriple } from '@firestone/game-state';
import { groupByFunction } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'bgs-triples',
	styleUrls: [`./bgs-triples.component.scss`],
	template: `
		<div class="triples-section">
			<div
				class="title"
				*ngIf="tierTriples?.length"
				[fsTranslate]="'battlegrounds.in-game.opponents.triple-title'"
			></div>
			<div class="triple-tiers" *ngIf="tierTriples?.length">
				<div
					*ngFor="let triple of tierTriples || []; trackBy: trackByFn"
					class="triple"
					[helpTooltip]="triple.tooltip"
				>
					<div class="number">x{{ triple.quantity }}</div>
					<tavern-level-icon
						[level]="getMinionTripleLevel(triple.minionTier)"
						class="tavern"
					></tavern-level-icon>
				</div>
			</div>
			<div
				class="subtitle empty"
				*ngIf="!tierTriples?.length"
				[fsTranslate]="'battlegrounds.in-game.opponents.triple-empty-state'"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTriplesComponent {
	tierTriples: { minionTier: number; quantity: number; tooltip: string }[];

	private _boardTurn: number;
	private allTriples: readonly BgsTriple[];

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
		this.tierTriples = Object.keys(groupedByTier).map((minionTier) => {
			const quantity = groupedByTier[minionTier].length;
			const tier = parseInt(minionTier);
			return {
				minionTier: tier,
				quantity: quantity,
				tooltip: this.i18n.translateString('battlegrounds.in-game.opponents.triple-tooltip', {
					quantity: quantity,
					tier: this.getMinionTripleLevel(tier),
				}),
			};
		});
	}

	constructor(private readonly i18n: ILocalizationService) {}
}
