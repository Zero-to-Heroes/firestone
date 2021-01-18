import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
			<bgs-minions-group class="minion-group" *ngFor="let group of groups" [group]="group"></bgs-minions-group>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsListComponent {
	@Input() set cards(value: readonly ReferenceCard[]) {
		this._cards = value;
		this.updateInfos();
	}

	_cards: readonly ReferenceCard[];
	groups: readonly BgsMinionsGroup[];

	private updateInfos() {
		if (!this._cards) {
			return;
		}

		const groupedByTribe = groupByFunction((card: ReferenceCard) => getEffectiveTribe(card))(this._cards);
		this.groups = Object.keys(groupedByTribe).map(tribeString => ({
			tribe: Race[tribeString],
			minions: groupedByTribe[tribeString],
		}));
	}
}
