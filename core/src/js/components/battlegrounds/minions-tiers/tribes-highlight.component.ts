import { ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { getEffectiveTribeEnum, getTribeIcon } from '../../../services/battlegrounds/bgs-utils';
import { BgsResetHighlightsEvent } from '../../../services/battlegrounds/store/events/bgs-reset-highlights-event';
import { BgsToggleHighlightTribeOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-tribe-on-board-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { capitalizeFirstLetter } from '../../../services/utils';

@Component({
	selector: 'tribes-highlight',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/tribes-highlight.component.scss',
	],
	template: `
		<div class="tribes-highlight">
			<!-- <div
				class="tribe"
				*ngFor="let tribe of tribes; trackBy: trackByFn"
				[ngClass]="{ 'highlighted': tribe.highlighted }"
				[helpTooltip]="tribe.tooltip"
				(click)="highlightTribe(tribe)"
			>
				<img class="icon" [src]="tribe.image" />
			</div> -->
			<div
				class="tribe reset"
				inlineSVG="assets/svg/restore.svg"
				(click)="resetHighlights()"
				helpTooltip="Reset all highlights"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTribesHighlightComponent {
	@Input() set cards(value: readonly ReferenceCard[]) {
		this._cards = value;
		this.updateInfos();
	}

	@Input() set highlightedTribes(value: readonly Race[]) {
		this._highlightedTribes = value;
		this.updateInfos();
	}

	tribes: readonly Tribe[];
	_cards: readonly ReferenceCard[];
	_highlightedTribes: readonly Race[];

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
	}

	highlightTribe(tribe: Tribe) {
		console.log('highlitghting tribe', tribe);
		this.battlegroundsUpdater.next(new BgsToggleHighlightTribeOnBoardEvent(tribe.tribe));
	}

	resetHighlights() {
		this.battlegroundsUpdater.next(new BgsResetHighlightsEvent());
	}

	trackByFn(tribe: Tribe) {
		return tribe.tribe;
	}

	private updateInfos() {
		if (!this._cards) {
			return;
		}

		const tribeIds = [...new Set(this._cards.map(card => getEffectiveTribeEnum(card)))];
		this.tribes = tribeIds.map(
			tribeId =>
				({
					tribe: tribeId,
					image: getTribeIcon(tribeId),
					highlighted: (this._highlightedTribes || []).includes(tribeId),
					tooltip: `Highlight ${this.getTribeName(tribeId)}s in the tavern`,
				} as Tribe),
		);
	}

	private getTribeName(value: Race): string {
		return capitalizeFirstLetter(Race[value].toLowerCase());
	}
}

interface Tribe {
	tribe: Race;
	image: string;
	highlighted: boolean;
	tooltip: string;
}
