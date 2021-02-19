import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsToggleHighlightMinionOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-minion-on-board-event';
import { BgsToggleHighlightTribeOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-tribe-on-board-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { FeatureFlags } from '../../../services/feature-flags';
import { OverwolfService } from '../../../services/overwolf.service';
import { capitalizeFirstLetter } from '../../../services/utils';
import { BgsMinionsGroup } from './bgs-minions-group';

@Component({
	selector: 'bgs-minions-group',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/bgs-minions-group.component.scss',
	],
	template: `
		<div class="bgs-minions-group">
			<div
				class="header"
				(click)="highlightTribe()"
				[ngClass]="{ 'highlighted': showTribesHighlight && highlighted, 'no-highlight': !showTribesHighlight }"
				[helpTooltip]="
					showTribesHighlight ? 'Click to highlight all minions of that tribe in the tavern' : null
				"
			>
				{{ title }}
			</div>
			<ul class="minions">
				<li
					class="minion"
					*ngFor="let minion of minions"
					[cardTooltip]="minion.cardId"
					[cardTooltipBgs]="true"
					[cardTooltipPosition]="_tooltipPosition"
					[helpTooltip]="showTribesHighlight ? 'Click to toggle minion highlight in the tavern' : null"
					[ngClass]="{
						'highlighted': showTribesHighlight && minion.highlighted,
						'no-highlight': !showTribesHighlight
					}"
					(click)="highlightMinion(minion)"
				>
					<img class="icon" [src]="minion.image" [cardTooltip]="minion.cardId" />
					<div class="name">{{ minion.name }}</div>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsGroupComponent implements AfterViewInit {
	showTribesHighlight = FeatureFlags.ENABLE_BG_TRIBE_HIGHLIGHT;

	@Input() set tooltipPosition(value: string) {
		this._tooltipPosition = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set group(value: BgsMinionsGroup) {
		this._group = value;
		this.updateInfos();
	}

	title: string;
	highlighted: boolean;
	minions: readonly Minion[];
	_group: BgsMinionsGroup;
	_tooltipPosition: string;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: AllCardsService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
	}

	highlightMinion(minion: Minion) {
		if (!this.showTribesHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMinionOnBoardEvent(minion.cardId));
	}

	highlightTribe() {
		if (!this.showTribesHighlight) {
			return;
		}
		console.log('highlitghting tribe', this._group.tribe);
		this.battlegroundsUpdater.next(new BgsToggleHighlightTribeOnBoardEvent(this._group.tribe));
	}

	private updateInfos() {
		if (!this._group) {
			return;
		}

		this.title = this.buildTitle(this._group.tribe);
		this.highlighted =
			this._group.highlightedTribes?.length && this._group.highlightedTribes.includes(this._group.tribe);
		this.minions = this._group.minions.map(minion => {
			const card = this.allCards.getCard(minion.id);
			return {
				cardId: minion.id,
				image: `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${minion.id}.jpg`,
				name: card.name,
				highlighted: this._group.highlightedMinions.includes(minion.id),
			};
		});
	}

	private buildTitle(tribe: Race): string {
		switch (tribe) {
			case Race.BLANK:
				return 'No tribe';
			default:
				return capitalizeFirstLetter(Race[tribe].toLowerCase());
		}
	}
}

interface Minion {
	readonly cardId: string;
	readonly image: string;
	readonly name: string;
	readonly highlighted: boolean;
}
