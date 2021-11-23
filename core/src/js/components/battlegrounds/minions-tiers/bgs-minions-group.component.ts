import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BgsToggleHighlightMinionOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-minion-on-board-event';
import { BgsToggleHighlightTribeOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-tribe-on-board-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
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
			<div class="header">
				<div>{{ title }}</div>
				<div
					class="highlight-button"
					[ngClass]="{
						'highlighted': _showTribesHighlight && highlighted,
						'no-highlight': !_showTribesHighlight
					}"
					inlineSVG="assets/svg/created_by.svg"
					(click)="highlightTribe()"
					[helpTooltip]="
						_showTribesHighlight
							? !highlighted
								? 'Click to highlight all ' + title + 's in the tavern'
								: 'Click to remove the ' + title + 's highlight in the tavern'
							: null
					"
					[helpTooltipPosition]="'left'"
				></div>
			</div>

			<ul class="minions">
				<li
					class="minion"
					*ngFor="let minion of minions"
					[cardTooltip]="minion.displayedCardIds"
					[cardTooltipBgs]="true"
					[cardTooltipPosition]="_tooltipPosition"
					(click)="clickMinion(minion)"
				>
					<img class="icon" [src]="minion.image" [cardTooltip]="minion.cardId" />
					<div class="name">{{ minion.name }}</div>
					<div
						class="highlight-minion-button"
						[ngClass]="{
							'highlighted': _showTribesHighlight && minion.highlighted,
							'no-highlight': !_showTribesHighlight
						}"
						inlineSVG="assets/svg/pinned.svg"
						(click)="highlightMinion(minion)"
						[helpTooltip]="
							_showTribesHighlight
								? !minion.highlighted
									? 'Pin this minion to highlight it in the tavern'
									: 'Unpin this minion to remove the highlight in the tavern'
								: null
						"
						[helpTooltipPosition]="'left'"
					></div>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsGroupComponent implements AfterViewInit {
	@Output() minionClick: EventEmitter<string> = new EventEmitter<string>();

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

	@Input() set showTribesHighlight(value: boolean) {
		this._showTribesHighlight = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	title: string;
	highlighted: boolean;
	minions: readonly Minion[];
	_group: BgsMinionsGroup;
	_tooltipPosition: string;
	_showTribesHighlight: boolean;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
	}

	highlightMinion(minion: Minion) {
		if (!this._showTribesHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMinionOnBoardEvent(minion.cardId));
	}

	clickMinion(minion: Minion) {
		this.minionClick.next(minion.cardId);
	}

	highlightTribe() {
		if (!this._showTribesHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightTribeOnBoardEvent(this._group.tribe));
	}

	private updateInfos() {
		if (!this._group?.minions?.length) {
			return;
		}

		this.title = this.buildTitle(this._group.tribe);
		this.highlighted =
			this._group.highlightedTribes?.length && this._group.highlightedTribes.includes(this._group.tribe);
		this.minions = this._group.minions
			.map((minion) => {
				const card = this.allCards.getCard(minion.id);
				const result = {
					cardId: minion.id,
					displayedCardIds: this.buildAllCardIds(minion.id),
					image: `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${minion.id}.jpg`,
					name: card.name,
					highlighted: this._group.highlightedMinions.includes(minion.id),
					techLevel: card.techLevel,
				};
				return result;
			})
			.sort((a, b) => {
				if (a.techLevel < b.techLevel) {
					return -1;
				}
				if (a.techLevel > b.techLevel) {
					return 1;
				}
				if (a.name?.toLowerCase() < b.name?.toLowerCase()) {
					return -1;
				}
				if (a.name?.toLowerCase() > b.name?.toLowerCase()) {
					return 1;
				}
				// To keep sorting consistent
				if (a.cardId < b.cardId) {
					return -1;
				}
				if (a.cardId > b.cardId) {
					return 1;
				}
				return 0;
			});
	}

	private buildAllCardIds(id: string): string {
		const premiumId = this.allCards.getCard(id).battlegroundsPremiumDbfId;
		if (!premiumId) {
			return id;
		}

		const premiumCard = this.allCards.getCardFromDbfId(premiumId);
		if (!premiumCard) {
			return id;
		}

		return [id, `${premiumCard.id}_golden`].join(',');
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
	readonly displayedCardIds: string;
	readonly image: string;
	readonly name: string;
	readonly highlighted: boolean;
}
