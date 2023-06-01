import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { GameTag, Race } from '@firestone-hs/reference-data';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { BgsToggleHighlightMechanicsOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-mechanics-on-board-event';
import { BgsToggleHighlightMinionOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-minion-on-board-event';
import { BgsToggleHighlightTribeOnBoardEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-highlight-tribe-on-board-event';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { BgsMinionsGroup } from './bgs-minions-group';

@Component({
	selector: 'bgs-minions-group',
	styleUrls: [
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/bgs-minions-group.component.scss',
	],
	template: `
		<ng-container *ngIf="{ tribe: tribe$ | async } as value">
			<div class="bgs-minions-group">
				<div class="header">
					<div>{{ title$ | async }}</div>
					<div
						class="highlight-button"
						*ngIf="value.tribe"
						[ngClass]="{
							highlighted: showTribesHighlight && (highlighted$ | async),
							'no-highlight': !showTribesHighlight
						}"
						inlineSVG="assets/svg/created_by.svg"
						(click)="highlightTribe(value.tribe)"
						[helpTooltip]="
							showTribesHighlight
								? !(highlighted$ | async)
									? (highlightTribeOnTooltip$ | async)
									: (highlightTribeOffTooltip$ | async)
								: null
						"
						[helpTooltipPosition]="'left'"
					></div>
				</div>

				<ul class="minions">
					<li
						class="minion"
						*ngFor="let minion of minions$ | async; trackBy: trackByFn"
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
									highlighted: showTribesHighlight && minion.highlighted,
									'no-highlight': !showTribesHighlight
								}"
								inlineSVG="assets/svg/pinned.svg"
								(click)="highlightMinion(minion)"
								[helpTooltip]="
									showTribesHighlight
										? !minion.highlighted
											? (highlightMinionOnTooltip$ | async)
											: (highlightMinionOffTooltip$ | async)
										: null
								"
								[helpTooltipPosition]="'left'"
							></div>
							<div
								class="highlight-minion-button battlecry"
								*ngIf="minion.hasBattlecry && showBattlecryHighlight"
								[ngClass]="{
									highlighted: minion.battlecryHighlight
								}"
								(click)="highlightBattlecry()"
								[helpTooltip]="
									!minion.battlecryHighlight
										? highlightBattlecryOnTooltip
										: highlightBattlecryOffTooltip
								"
							>
								<span class="label">B</span>
							</div>
							<div
								class="highlight-minion-button deathrattle"
								*ngIf="minion.hasDeathrattle && showBattlecryHighlight"
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
								*ngIf="minion.hasTaunt && showBattlecryHighlight"
								[ngClass]="{
									highlighted: minion.tauntHighlight
								}"
								(click)="highlightTaunt()"
								[helpTooltip]="
									!minion.tauntHighlight ? highlightTauntOnTooltip : highlightTauntOffTooltip
								"
							>
								<span class="label">T</span>
							</div>
							<div
								class="highlight-minion-button divine-shield"
								*ngIf="minion.hasDivineShield && showBattlecryHighlight"
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
								*ngIf="minion.hasEndOfTurn && showBattlecryHighlight"
								[ngClass]="{
									highlighted: minion.endOfTurnHighlight
								}"
								(click)="highlightEndOfTurn()"
								[helpTooltip]="
									!minion.endOfTurnHighlight
										? highlightEndOfTurnOnTooltip
										: highlightEndOfTurnOffTooltip
								"
							>
								<span class="label">E</span>
							</div>
							<div
								class="highlight-minion-button reborn"
								*ngIf="minion.hasReborn && showBattlecryHighlight"
								[ngClass]="{
									highlighted: minion.rebornHighlight
								}"
								(click)="highlightReborn()"
								[helpTooltip]="
									!minion.rebornHighlight ? highlightRebornOnTooltip : highlightRebornOffTooltip
								"
							>
								<span class="label">R</span>
							</div>
						</div>
					</li>
				</ul>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsGroupComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	@Output() minionClick: EventEmitter<string> = new EventEmitter<string>();

	title$: Observable<string>;
	highlighted$: Observable<boolean>;
	minions$: Observable<readonly Minion[]>;
	tribe$: Observable<Race>;

	highlightTribeOnTooltip$: Observable<string>;
	highlightTribeOffTooltip$: Observable<string>;
	highlightMinionOnTooltip$: Observable<string>;
	highlightMinionOffTooltip$: Observable<string>;

	@Input() set group(value: BgsMinionsGroup) {
		this.id = value.title + '-' + value.tribe;
		this.group$$.next(value);
	}

	@Input() set showGoldenCards(value: boolean) {
		this.showGoldenCards$$.next(value);
	}

	@Input() showTribesHighlight: boolean;
	@Input() showBattlecryHighlight: boolean;

	private group$$ = new BehaviorSubject<BgsMinionsGroup>(null);
	private showGoldenCards$$ = new BehaviorSubject<boolean>(true);

	private id: string;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr);
	}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow())?.battlegroundsUpdater;
	}

	ngAfterContentInit(): void {
		this.title$ = this.group$$.pipe(this.mapData((group) => group.title));
		this.tribe$ = this.group$$.pipe(this.mapData((group) => group.tribe));
		this.highlightTribeOnTooltip$ = this.title$.pipe(
			this.mapData((title) =>
				this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-tribe', {
					value: title,
				}),
			),
		);
		this.highlightTribeOffTooltip$ = this.title$.pipe(
			this.mapData((title) =>
				this.i18n.translateString('battlegrounds.in-game.minions-list.unhighlight-tribe', {
					value: title,
				}),
			),
		);
		this.highlightMinionOnTooltip$ = this.title$.pipe(
			this.mapData((title) =>
				this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-minion', {
					value: title,
				}),
			),
		);
		this.highlightMinionOffTooltip$ = this.title$.pipe(
			this.mapData((title) =>
				this.i18n.translateString('battlegrounds.in-game.minions-list.unhighlight-minion', {
					value: title,
				}),
			),
		);
		this.highlighted$ = this.group$$.pipe(
			this.mapData((group) => group.highlightedTribes?.length && group.highlightedTribes.includes(group.tribe)),
		);
		this.minions$ = combineLatest([
			this.group$$.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b))),
			this.showGoldenCards$$.pipe(distinctUntilChanged()),
		]).pipe(
			debounceTime(50),
			this.mapData(
				([group, showGoldenCards]) => {
					const start = performance.now();
					const result = group.minions
						.map((minion) => {
							const card = this.allCards.getCard(minion.id);
							const hasBattlecry = card.mechanics?.includes(GameTag[GameTag.BATTLECRY]);
							const hasDeathrattle = card.mechanics?.includes(GameTag[GameTag.DEATHRATTLE]);
							const hasTaunt = card.mechanics?.includes(GameTag[GameTag.TAUNT]);
							const hasDivineShield = card.mechanics?.includes(GameTag[GameTag.DIVINE_SHIELD]);
							const hasEndOfTurn = card.mechanics?.includes(GameTag[GameTag.END_OF_TURN]);
							const hasReborn = card.mechanics?.includes(GameTag[GameTag.REBORN]);
							const result = {
								cardId: minion.id,
								displayedCardIds: this.buildAllCardIds(minion.id, showGoldenCards),
								image: `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${minion.id}.jpg`,
								name: card.name,
								highlighted: group.highlightedMinions.includes(minion.id),
								battlecryHighlight:
									hasBattlecry && group.highlightedMechanics.includes(GameTag.BATTLECRY),
								deathrattleHighlight:
									hasDeathrattle && group.highlightedMechanics.includes(GameTag.DEATHRATTLE),
								tauntHighlight: hasTaunt && group.highlightedMechanics.includes(GameTag.TAUNT),
								divineShieldHighlight:
									hasDivineShield && group.highlightedMechanics.includes(GameTag.DIVINE_SHIELD),
								endOfTurnHighlight:
									hasEndOfTurn && group.highlightedMechanics.includes(GameTag.END_OF_TURN),
								rebornHighlight: hasReborn && group.highlightedMechanics.includes(GameTag.REBORN),
								techLevel: card.techLevel,
								hasBattlecry: hasBattlecry,
								hasDeathrattle: hasDeathrattle,
								hasTaunt: hasTaunt,
								hasDivineShield: hasDivineShield,
								hasEndOfTurn: hasEndOfTurn,
								hasReborn: hasReborn,
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
					return result;
				},
				(a: any, b: any) => a == b,
				0,
			),
		);
	}

	highlightMinion(minion: Minion) {
		if (!this.showTribesHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMinionOnBoardEvent(minion.cardId));
	}

	clickMinion(minion: Minion) {
		this.minionClick.next(minion.cardId);
	}

	highlightTribe(tribe: Race) {
		if (!this.showTribesHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightTribeOnBoardEvent(tribe));
	}

	highlightBattlecry() {
		if (!this.showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.BATTLECRY));
	}

	highlightDeathrattle() {
		if (!this.showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.DEATHRATTLE));
	}

	highlightEndOfTurn() {
		if (!this.showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.END_OF_TURN));
	}

	highlightTaunt() {
		if (!this.showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.TAUNT));
	}

	highlightDivineShield() {
		if (!this.showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.DIVINE_SHIELD));
	}

	highlightReborn() {
		if (!this.showBattlecryHighlight) {
			return;
		}
		this.battlegroundsUpdater.next(new BgsToggleHighlightMechanicsOnBoardEvent(GameTag.REBORN));
	}

	trackByFn(index: number, minion: Minion) {
		return minion.cardId;
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
	highlightRebornOnTooltip = this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
		value: this.i18n.translateString('global.mechanics.reborn'),
	});
	highlightRebornOffTooltip = this.i18n.translateString('battlegrounds.in-game.minions-list.unhighlight-mechanics', {
		value: this.i18n.translateString('global.mechanics.reborn'),
	});
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
	readonly hasReborn?: boolean;
	readonly battlecryHighlight?: boolean;
	readonly deathrattleHighlight?: boolean;
	readonly tauntHighlight?: boolean;
	readonly divineShieldHighlight?: boolean;
	readonly endOfTurnHighlight?: boolean;
	readonly rebornHighlight?: boolean;
	readonly hasDeathrattle?: boolean;
	readonly hasDivineShield?: boolean;
}
