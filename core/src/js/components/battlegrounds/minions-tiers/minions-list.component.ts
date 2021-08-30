import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { Race, ReferenceCard } from '@firestone-hs/reference-data';
import { getEffectiveTribe, tribeValueForSort } from '../../../services/battlegrounds/bgs-utils';
import { BgsResetHighlightsEvent } from '../../../services/battlegrounds/store/events/bgs-reset-highlights-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
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
				[showTribesHighlight]="showTribesHighlight"
			></bgs-minions-group>
			<div class="reset-all-button" (click)="resetHighlights()" *ngIf="showTribesHighlight">
				<div class="background-second-part"></div>
				<div class="background-main-part"></div>
				<div class="content">
					<div class="icon" inlineSVG="assets/svg/restore.svg"></div>
					Reset
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsListComponent implements AfterViewInit {
	@Input() set tooltipPosition(value: string) {
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

	@Input() showTribesHighlight: boolean;

	_cards: readonly ReferenceCard[];
	_highlightedMinions: readonly string[];
	_highlightedTribes: readonly Race[];
	groups: readonly BgsMinionsGroup[];
	_tooltipPosition: string;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
	}

	resetHighlights() {
		this.battlegroundsUpdater.next(new BgsResetHighlightsEvent());
	}

	private updateInfos() {
		if (!this._cards) {
			return;
		}

		const groupedByTribe = groupByFunction((card: ReferenceCard) => getEffectiveTribe(card, false))(this._cards);
		this.groups = Object.keys(groupedByTribe)
			.sort((a: string, b: string) => tribeValueForSort(a) - tribeValueForSort(b)) // Keep consistent ordering
			.map((tribeString) => ({
				tribe: Race[tribeString],
				minions: groupedByTribe[tribeString],
				highlightedMinions: this._highlightedMinions || [],
				highlightedTribes: this._highlightedTribes || [],
			}));
	}
}
