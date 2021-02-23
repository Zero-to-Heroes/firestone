import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { getEffectiveTribe } from '../../../services/battlegrounds/bgs-utils';
import { groupByFunction } from '../../../services/utils';
import { BgsMinionsGroup } from './bgs-minions-group';

@Component({
	selector: 'bgs-minions-list',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/bgs-minions-list.component.scss',
	],
	template: `
		<div class="bgs-minions-list">
			<bgs-minions-group
				class="minion-group"
				*ngFor="let group of groups"
				[group]="group"
				[tooltipPosition]="_tooltipPosition"
			></bgs-minions-group>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsListComponent {
	@Input() set tooltipPosition(value: string) {
		// console.debug('[minions-list] tooltip position', value);
		this._tooltipPosition = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set cards(value: readonly ReferenceCard[]) {
		this._cards = value;
		this.updateInfos();
	}

	@Input() set highlightedMinions(value: readonly string[]) {
		this._highlightedMinions = value;
		this.updateInfos();
	}

	@Input() set highlightedTribes(value: readonly Race[]) {
		this._highlightedTribes = value;
		this.updateInfos();
	}

	_cards: readonly ReferenceCard[];
	_highlightedMinions: readonly string[];
	_highlightedTribes: readonly Race[];
	groups: readonly BgsMinionsGroup[];
	_tooltipPosition: string;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	private updateInfos() {
		if (!this._cards) {
			return;
		}

		const groupedByTribe = groupByFunction((card: ReferenceCard) => getEffectiveTribe(card))(this._cards);
		this.groups = Object.keys(groupedByTribe)
			.sort((a: string, b: string) => this.tribeValueForSort(a) - this.tribeValueForSort(b)) // Keep consistent ordering
			.map(tribeString => ({
				tribe: Race[tribeString],
				minions: groupedByTribe[tribeString],
				highlightedMinions: this._highlightedMinions || [],
				highlightedTribes: this._highlightedTribes || [],
			}));
	}

	private tribeValueForSort(tribe: string): number {
		switch (tribe) {
			case Race[Race.BEAST]:
				return 1;
			case Race[Race.DEMON]:
				return 2;
			case Race[Race.DRAGON]:
				return 3;
			case Race[Race.ELEMENTAL]:
				return 4;
			case Race[Race.MECH]:
				return 5;
			case Race[Race.MURLOC]:
				return 6;
			case Race[Race.PIRATE]:
				return 7;
			case Race[Race.ALL]:
				return 8;
			case Race[Race.BLANK]:
				return 9;
		}
	}
}
