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
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { OverwolfService } from '../../../services/overwolf.service';
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
								? highlightTribeOnTooltip
								: highlightTribeOffTooltip
							: null
					"
					[helpTooltipPosition]="'left'"
				></div>
			</div>

			<ul class="minions">
				<li
					class="minion"
					*ngFor="let minion of minions; trackBy: trackByFn"
					[cardTooltip]="minion.displayedCardIds"
					[cardTooltipBgs]="true"
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
									? highlightMinionOnTooltip
									: highlightMinionOffTooltip
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

	@Input() set group(value: BgsMinionsGroup) {
		this._group = value;
		this.updateInfos();
	}

	@Input() set showTribesHighlight(value: boolean) {
		this._showTribesHighlight = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	@Input() set showGoldenCards(value: boolean) {
		this._showGoldenCards = value;
		this.updateInfos();
	}

	title: string;
	highlighted: boolean;
	minions: readonly Minion[] = [];
	_group: BgsMinionsGroup;
	_showTribesHighlight: boolean;

	highlightTribeOnTooltip: string;
	highlightTribeOffTooltip: string;
	highlightMinionOnTooltip: string;
	highlightMinionOffTooltip: string;

	private _showGoldenCards = true;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow())?.battlegroundsUpdater;
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

	trackByFn(index: number, minion: Minion) {
		return minion.cardId;
	}

	private updateInfos() {
		if (!this._group?.minions?.length) {
			return;
		}

		// this.minions = [];
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr?.detectChanges();
		// }
		// // Otherwise I get a "cannot read property 'destroyed' of null"
		// Doesn't happen with a trackByFn?
		// setTimeout(() => {
		this.title = this.buildTitle(this._group.tribe);
		this.highlightTribeOnTooltip = this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-tribe', {
			value: this.title,
		});
		this.highlightTribeOffTooltip = this.i18n.translateString(
			'battlegrounds.in-game.minions-list.unhighlight-tribe',
			{
				value: this.title,
			},
		);
		this.highlightMinionOnTooltip = this.i18n.translateString(
			'battlegrounds.in-game.minions-list.highlight-minion',
			{
				value: this.title,
			},
		);
		this.highlightMinionOffTooltip = this.i18n.translateString(
			'battlegrounds.in-game.minions-list.unhighlight-minion',
			{
				value: this.title,
			},
		);
		this.highlighted =
			this._group.highlightedTribes?.length && this._group.highlightedTribes.includes(this._group.tribe);
		this.minions = this._group.minions
			.map((minion) => {
				const card = this.allCards.getCard(minion.id);
				const result = {
					cardId: minion.id,
					displayedCardIds: this.buildAllCardIds(minion.id, this._showGoldenCards),
					image: `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${minion.id}.jpg?v=2`,
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
		// });
	}

	private buildAllCardIds(id: string, showGoldenCards: boolean): string {
		if (!showGoldenCards) {
			return id;
		}

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
		return this.i18n.translateString(`global.tribe.${Race[tribe].toLowerCase()}`);
	}
}

interface Minion {
	readonly cardId: string;
	readonly displayedCardIds: string;
	readonly image: string;
	readonly name: string;
	readonly highlighted: boolean;
}
