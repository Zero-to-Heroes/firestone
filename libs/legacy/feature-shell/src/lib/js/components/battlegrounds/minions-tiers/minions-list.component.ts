import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { tribeValueForSort } from '../../../services/battlegrounds/bgs-utils';
import { BgsResetHighlightsEvent } from '../../../services/battlegrounds/store/events/bgs-reset-highlights-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { groupByFunction } from '../../../services/utils';
import { Tier } from './battlegrounds-minions-tiers-view.component';
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
				[showTribesHighlight]="_showTribesHighlight"
				[showBattlecryHighlight]="_showBattlecryHighlight"
				[showGoldenCards]="_showGoldenCards"
			></bgs-minions-group>
			<div class="reset-all-button" (click)="resetHighlights()" *ngIf="_showTribesHighlight">
				<div class="background-second-part"></div>
				<div class="background-main-part"></div>
				<div class="content">
					<div class="icon" inlineSVG="assets/svg/restore.svg"></div>
					{{ 'battlegrounds.in-game.minions-list.reset-button' | owTranslate }}
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsListComponent implements AfterViewInit {
	@Input() set tier(value: Tier) {
		this._cards = value.cards.filter((c) => !!c);
		this._groupingFunction = value.groupingFunction;
		this.updateInfos();
	}

	@Input() set groupingFunction(value: (card: ReferenceCard) => string) {
		this._groupingFunction = value;
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

	@Input() set highlightedMechanics(value: readonly GameTag[]) {
		this._highlightedMechanics = value;
		this.updateInfos();
	}

	@Input() set showTribesHighlight(value: boolean) {
		this._showTribesHighlight = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set showBattlecryHighlight(value: boolean) {
		this._showBattlecryHighlight = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set showGoldenCards(value: boolean) {
		this._showGoldenCards = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_cards: readonly ReferenceCard[];
	_groupingFunction: (card: ReferenceCard) => string;
	_highlightedMinions: readonly string[];
	_highlightedTribes: readonly Race[];
	_highlightedMechanics: readonly GameTag[];
	_showTribesHighlight: boolean;
	_showBattlecryHighlight: boolean;
	_showGoldenCards: boolean;
	groups: readonly BgsMinionsGroup[];

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow())?.battlegroundsUpdater;
	}

	resetHighlights() {
		this.battlegroundsUpdater.next(new BgsResetHighlightsEvent());
	}

	private updateInfos() {
		if (!this._cards) {
			return;
		}

		const groupedByTribe = groupByFunction(this._groupingFunction)(this._cards);
		this.groups = Object.keys(groupedByTribe)
			.sort((a: string, b: string) => tribeValueForSort(a) - tribeValueForSort(b)) // Keep consistent ordering
			.map((tribeString) => {
				return {
					tribe: isNaN(+tribeString) ? Race[tribeString] : null,
					title: isNaN(+tribeString)
						? this.i18n.translateString(`global.tribe.${tribeString.toLowerCase()}`)
						: this.i18n.translateString(`app.battlegrounds.filters.tier.tier`, { value: tribeString }),
					minions: groupedByTribe[tribeString],
					highlightedMinions: this._highlightedMinions || [],
					highlightedTribes: this._highlightedTribes || [],
					highlightedMechanics: this._highlightedMechanics || [],
				};
			});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
