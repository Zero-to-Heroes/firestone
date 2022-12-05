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
import { GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BgsToggleHighlightMechanicsOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-mechanics-on-board-event';
import { BgsToggleHighlightMinionOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-minion-on-board-event';
import { BgsToggleHighlightTribeOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-tribe-on-board-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { BgsMinionsGroup } from './bgs-minions-group';

@Component({
	selector: 'bgs-minions-group',
	styleUrls: [
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/bgs-minions-group.component.scss',
	],
	template: `
		<div class="bgs-minions-group">
			<div class="header">
				<div>{{ title }}</div>
				<div
					class="highlight-button"
					*ngIf="tribe"
					[ngClass]="{
						highlighted: _showTribesHighlight && highlighted,
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
					<div class="highlight-buttons">
						<div
							class="highlight-minion-button"
							[ngClass]="{
								highlighted: _showTribesHighlight && minion.highlighted,
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
						<div
							class="highlight-minion-button battlecry"
							*ngIf="minion.hasBattlecry && _showBattlecryHighlight"
							[ngClass]="{
								highlighted: minion.battlecryHighlight
							}"
							(click)="highlightBattlecry()"
							[helpTooltip]="
								!minion.battlecryHighlight ? highlightBattlecryOnTooltip : highlightBattlecryOffTooltip
							"
						>
							<span class="label">B</span>
						</div>
						<div
							class="highlight-minion-button deathrattle"
							*ngIf="minion.hasDeathrattle && _showBattlecryHighlight"
							[ngClass]="{
								highlighted: minion.deathrattleHighlight
							}"
							(click)="highlightDeathrattle()"
							[helpTooltip]="
								!minion.deathrattleHighlight
									? highlightDeathrattleOnTooltip
									: highlightDeathrattleOffTooltip
							"
						>
							<span class="label">D</span>
						</div>
						<div
							class="highlight-minion-button taunt"
							*ngIf="minion.hasTaunt && _showBattlecryHighlight"
							[ngClass]="{
								highlighted: minion.tauntHighlight
							}"
							(click)="highlightTaunt()"
							[helpTooltip]="!minion.tauntHighlight ? highlightTauntOnTooltip : highlightTauntOffTooltip"
						>
							<span class="label">T</span>
						</div>
						<div
							class="highlight-minion-button divine-shield"
							*ngIf="minion.hasDivineShield && _showBattlecryHighlight"
							[ngClass]="{
								highlighted: minion.divineShieldHighlight
							}"
							(click)="highlightDivineShield()"
							[helpTooltip]="
								!minion.divineShieldHighlight
									? highlightDivineShieldOnTooltip
									: highlightDivineShieldOffTooltip
							"
						>
							<span class="label">DS</span>
						</div>
						<div
							class="highlight-minion-button end-of-turn"
							*ngIf="minion.hasEndOfTurn && _showBattlecryHighlight"
							[ngClass]="{
								highlighted: minion.endOfTurnHighlight
							}"
							(click)="highlightEndOfTurn()"
							[helpTooltip]="
								!minion.divineShieldHighlight
									? highlightDivineShieldOnTooltip
									: highlightDivineShieldOffTooltip
							"
						>
							<span class="label">E</span>
						</div>
					</div>
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

	@Input() set showBattlecryHighlight(value: boolean) {
		this._showBattlecryHighlight = value;
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
	tribe: Race;
	_showTribesHighlight: boolean;
	_showBattlecryHighlight: boolean;

	highlightTribeOnTooltip: string;
	highlightTribeOffTooltip: string;
	highlightMinionOnTooltip: string;
	highlightMinionOffTooltip: string;
	highlightBattlecryOnTooltip = this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
		value: this.i18n.translateString('global.mechanics.battlecry'),
	});
	highlightBattlecryOffTooltip = this.i18n.translateString(
		'battlegrounds.in-game.minions-list.unhighlight-mechanics',
		{
			value: this.i18n.translateString('global.mechanics.battlecry'),
		},
	);
	highlightDeathrattleOnTooltip = this.i18n.translateString(
		'battlegrounds.in-game.minions-list.highlight-mechanics',
		{
			value: this.i18n.translateString('global.mechanics.deathrattle'),
		},
	);
	highlightDeathrattleOffTooltip = this.i18n.translateString(
		'battlegrounds.in-game.minions-list.unhighlight-mechanics',
		{
			value: this.i18n.translateString('global.mechanics.deathrattle'),
		},
	);
	highlightTauntOnTooltip = this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
		value: this.i18n.translateString('global.mechanics.taunt'),
	});
	highlightTauntOffTooltip = this.i18n.translateString('battlegrounds.in-game.minions-list.unhighlight-mechanics', {
		value: this.i18n.translateString('global.mechanics.taunt'),
	});
	highlightDivineShieldOnTooltip = this.i18n.translateString(
		'battlegrounds.in-game.minions-list.highlight-mechanics',
		{
			value: this.i18n.translateString('global.mechanics.divine_shield'),
		},
	);
	highlightDivineShieldOffTooltip = this.i18n.translateString(
		'battlegrounds.in-game.minions-list.unhighlight-mechanics',
		{
			value: this.i18n.translateString('global.mechanics.divine_shield'),
		},
	);
	highlightEndOfTurnOnTooltip = this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
		value: this.i18n.translateString('global.mechanics.end_of_turn'),
	});
	highlightEndOfTurnOffTooltip = this.i18n.translateString(
		'battlegrounds.in-game.minions-list.unhighlight-mechanics',
		{
			value: this.i18n.translateString('global.mechanics.end_of_turn'),
		},
	);

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
		this.battlegroundsUpdater.next(new BgsToggleHighlightTribeOnBoardEvent(this.tribe));
	}

	highlightBattlecry() {
		if (!this._showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.BATTLECRY));
	}

	highlightDeathrattle() {
		if (!this._showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.DEATHRATTLE));
	}

	highlightEndOfTurn() {
		if (!this._showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.END_OF_TURN));
	}

	highlightTaunt() {
		if (!this._showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.TAUNT));
	}

	highlightDivineShield() {
		if (!this._showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.DIVINE_SHIELD));
	}

	trackByFn(index: number, minion: Minion) {
		return minion.cardId;
	}

	private updateInfos() {
		if (!this._group?.minions?.length) {
			return;
		}

		this.title = this._group.title;
		this.tribe = this._group.tribe;
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
				const hasBattlecry = card.mechanics?.includes(GameTag[GameTag.BATTLECRY]);
				const hasDeathrattle = card.mechanics?.includes(GameTag[GameTag.DEATHRATTLE]);
				const hasTaunt = card.mechanics?.includes(GameTag[GameTag.TAUNT]);
				const hasDivineShield = card.mechanics?.includes(GameTag[GameTag.DIVINE_SHIELD]);
				const hasEndOfTurn = card.mechanics?.includes(GameTag[GameTag.END_OF_TURN]);
				const result = {
					cardId: minion.id,
					displayedCardIds: this.buildAllCardIds(minion.id, this._showGoldenCards),
					image: `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${minion.id}.jpg`,
					name: card.name,
					highlighted: this._group.highlightedMinions.includes(minion.id),
					battlecryHighlight: hasBattlecry && this._group.highlightedMechanics.includes(GameTag.BATTLECRY),
					deathrattleHighlight:
						hasDeathrattle && this._group.highlightedMechanics.includes(GameTag.DEATHRATTLE),
					tauntHighlight: hasTaunt && this._group.highlightedMechanics.includes(GameTag.TAUNT),
					divineShieldHighlight:
						hasDivineShield && this._group.highlightedMechanics.includes(GameTag.DIVINE_SHIELD),
					endOfTurnHighlight: hasEndOfTurn && this._group.highlightedMechanics.includes(GameTag.END_OF_TURN),
					techLevel: card.techLevel,
					hasBattlecry: hasBattlecry,
					hasDeathrattle: hasDeathrattle,
					hasTaunt: hasTaunt,
					hasDivineShield: hasDivineShield,
					hasEndOfTurn: hasEndOfTurn,
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
}

interface Minion {
	readonly cardId: string;
	readonly displayedCardIds: string;
	readonly image: string;
	readonly name: string;
	readonly techLevel?: number;
	readonly highlighted: boolean;
	readonly hasTaunt?: boolean;
	readonly hasEndOfTurn?: boolean;
	readonly hasBattlecry?: boolean;
	readonly battlecryHighlight?: boolean;
	readonly deathrattleHighlight?: boolean;
	readonly tauntHighlight?: boolean;
	readonly divineShieldHighlight?: boolean;
	readonly endOfTurnHighlight?: boolean;
	readonly hasDeathrattle?: boolean;
	readonly hasDivineShield?: boolean;
}
