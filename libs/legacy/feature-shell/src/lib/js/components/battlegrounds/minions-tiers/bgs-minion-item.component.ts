import { ComponentType } from '@angular/cdk/portal';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardType, GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService, BgsTrinketStrategyTipsTooltipComponent } from '@firestone/battlegrounds/common';
import { ExtendedReferenceCard, isBgsTrinket, MECHANICS_IN_GAME } from '@firestone/battlegrounds/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, filter, Observable } from 'rxjs';
import { isBgsSpell } from '../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { BgsMinionsGroup } from './bgs-minions-group';

@Component({
	selector: 'bgs-minion-item',
	styleUrls: [`../../../../css/global/cdk-overlay.scss`, './bgs-minion-item.component.scss'],
	template: `
		<div
			class="minion"
			*ngIf="minion$ | async as minion"
			[ngClass]="{ banned: minion.banned, locked: minion.trinketLocked, faded: minion.faded }"
			[cardTooltip]="minion.displayedCardIds"
			[cardTooltipRelatedCardIds]="minion.relatedCardIds"
			[cardTooltipBgs]="true"
			(contextmenu)="highlightMinion(minion, $event)"
		>
			<img
				class="icon tile-icon"
				*ngIf="hasTile"
				[src]="minion.image"
				[cardTooltip]="minion.cardId"
				(error)="onImageError($event)"
			/>
			<img
				class="icon tile-icon fallback"
				*ngIf="!hasTile"
				[src]="minion.fallbackImage"
				[cardTooltip]="minion.cardId"
			/>
			<div class="name" [ngStyle]="leftPadding != null ? { 'padding-left.px': leftPadding } : {}">
				<div class="tavern-tier" *ngIf="minion.techLevel != null && showTavernTierIcon">
					<tavern-level-icon [level]="minion.techLevel" class="tavern"></tavern-level-icon>
				</div>
				<div class="gold-cost" *ngIf="minion.goldCost != null">
					<img
						class="icon"
						src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/coin_mana.png"
					/>
					<div class="cost">{{ minion.goldCost }}</div>
				</div>
				<span class="name-text" [helpTooltip]="minion.bannedReason ?? minion.trinketLockedReason">
					{{ minion.name }}
				</span>
				<i
					class="info"
					*ngIf="showTips$ | async"
					componentTooltip
					[componentType]="componentType"
					[componentInput]="minion.cardId"
					[componentTooltipPosition]="'bottom-left'"
					[componentTooltipCssClass]="'with-top-margin'"
				>
					<svg>
						<use xlink:href="assets/svg/sprite.svg#info" />
					</svg>
				</i>
			</div>
			<minion-highlight-buttons
				class="highlight-buttons"
				*ngIf="showTribesHighlight && !minion.hidePins"
				[minion]="minion"
				[hideMechanicsHighlight]="hideMechanicsHighlight"
			></minion-highlight-buttons>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionItemComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	componentType: ComponentType<BgsTrinketStrategyTipsTooltipComponent> = BgsTrinketStrategyTipsTooltipComponent;

	minion$: Observable<Minion>;
	showTips$: Observable<boolean>;

	@Input() set minion(value: ExtendedReferenceCard) {
		this.minion$$.next(value);
	}
	@Input() set showGoldenCards(value: boolean) {
		this.showGoldenCards$$.next(value);
	}
	@Input() set showTrinketTips(value: boolean) {
		this.showTrinketTips$$.next(value);
	}
	@Input() set highlightedMinions(value: readonly string[]) {
		this.highlightedMinions$$.next(value ?? []);
	}
	@Input() set highlightedTribes(value: readonly Race[]) {
		this.highlightedTribes$$.next(value ?? []);
	}
	@Input() set highlightedMechanics(value: readonly GameTag[]) {
		this.highlightedMechanics$$.next(value ?? []);
	}
	@Input() set fadeHigherTierCards(value: boolean) {
		this.fadeHigherTierCards$$.next(value);
	}
	@Input() set tavernTier(value: number) {
		this.tavernTier$$.next(value);
	}

	@Input() showTribesHighlight: boolean;
	@Input() hideMechanicsHighlight: boolean;
	@Input() showTavernTierIcon: boolean;
	@Input() leftPadding = null;

	hasTile = true;

	private minion$$ = new BehaviorSubject<ExtendedReferenceCard | null>(null);
	private showGoldenCards$$ = new BehaviorSubject<boolean>(true);
	private showTrinketTips$$ = new BehaviorSubject<boolean>(true);
	private highlightedMinions$$ = new BehaviorSubject<readonly string[]>([]);
	private highlightedTribes$$ = new BehaviorSubject<readonly Race[]>([]);
	private highlightedMechanics$$ = new BehaviorSubject<readonly GameTag[]>([]);
	private fadeHigherTierCards$$ = new BehaviorSubject<boolean>(false);
	private tavernTier$$ = new BehaviorSubject<number | null>(null);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly highlighter: BgsBoardHighlighterService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.minion$ = combineLatest([
			this.minion$$,
			this.showGoldenCards$$,
			this.highlightedMinions$$,
			this.highlightedTribes$$,
			this.highlightedMechanics$$,
			this.fadeHigherTierCards$$,
			this.tavernTier$$,
		]).pipe(
			filter(
				([minion, showGoldenCards, highlightedMinions, highlightedTribes, highlightedMechanics]) => !!minion,
			),
			this.mapData(
				([
					card,
					showGoldenCards,
					highlightedMinions,
					highlightedTribes,
					highlightedMechanics,
					fadeHigherTierCards,
					tavernTier,
				]) => {
					// console.debug(
					// 	'[bgs-minion-item] building minion',
					// 	card,
					// 	highlightedMinions,
					// 	highlightedTribes,
					// 	highlightedMechanics,
					// );
					const mechanicsHighlights: readonly MinionHighlight[] = MECHANICS_IN_GAME.filter(
						(m) => m.canBeHighlighted !== false,
					).map((m) => {
						const hasMechanics = card.mechanics?.includes(GameTag[m.mechanic]);
						const highlighted = hasMechanics && highlightedMechanics.includes(m.mechanic);
						const mechanicsName = this.i18n.translateString(
							`global.mechanics.${GameTag[m.mechanic].toLowerCase()}`,
						);
						const result: MinionHighlight = {
							mechanic: m.mechanic,
							label: m.tierId,
							hasMechanics: hasMechanics,
							highlighted: highlighted,
							tooltip: highlighted
								? this.i18n.translateString(
										'battlegrounds.in-game.minions-list.unhighlight-mechanics',
										{ value: mechanicsName },
								  )
								: this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
										value: mechanicsName,
								  }),
						};
						return result;
					});

					const result: Minion = {
						cardId: card.id,
						displayedCardIds: this.buildAllCardIds(card.id, showGoldenCards),
						relatedCardIds: this.buildRelatedCardIds(card.id),
						image: `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.id}.jpg`,
						fallbackImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card.id}.jpg`,
						name: card.name, // Already enhanced when building groups
						highlighted: highlightedMinions.includes(card.id),
						banned: card.banned,
						bannedReason: card.bannedReason,
						goldCost: isBgsSpell(card) || isBgsTrinket(card) ? card.cost ?? 0 : null,
						techLevel: card.techLevel,

						trinketLocked: card.trinketLocked,
						trinketLockedReason: card.trinketLockedReason?.join('<br />'),
						faded: fadeHigherTierCards && (!card.techLevel || card.techLevel > tavernTier),

						hidePins: isBgsTrinket(card),
						hightMinionTooltip: this.i18n.translateString(
							'battlegrounds.in-game.minions-list.highlight-minion',
							{
								value: card.name,
							},
						),
						mechanicsHighlights: mechanicsHighlights,
					};
					return result;
				},
			),
		);
		this.showTips$ = combineLatest([this.minion$$, this.showTrinketTips$$]).pipe(
			this.mapData(([card, showTrinketTips]) => showTrinketTips && isBgsTrinket(card)),
		);
	}

	trackByFn(index: number, minion: Minion) {
		return minion.cardId;
	}

	highlightMinion(minion: Minion, event: MouseEvent) {
		// Only trigger on right click
		if (event.button !== 2) {
			return;
		}

		this.highlighter.toggleMinionsToHighlight([minion.cardId]);
	}

	onImageError(event: Event) {
		this.hasTile = false;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
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

	private buildRelatedCardIds(id: string): readonly string[] {
		const refCard = this.allCards.getCard(id);
		return refCard.relatedCardDbfIds?.map((dbfId) => this.allCards.getCard(dbfId).id) ?? [];
	}
}

export interface Minion {
	readonly cardId: string;
	readonly displayedCardIds: string;
	readonly relatedCardIds: readonly string[];
	readonly image: string;
	readonly fallbackImage: string;
	readonly name: string;
	readonly banned?: boolean;
	readonly bannedReason?: string;
	readonly techLevel?: number;
	readonly goldCost: number;

	readonly highlighted: boolean;
	readonly hightMinionTooltip?: string;
	readonly mechanicsHighlights: readonly MinionHighlight[];

	// readonly hasTaunt?: boolean;
	// readonly hasEndOfTurn?: boolean;
	// readonly hasBattlecry?: boolean;
	// readonly hasReborn?: boolean;
	// readonly hasBgSpell?: boolean;

	readonly trinketLocked?: boolean;
	readonly trinketLockedReason?: string;

	// readonly battlecryHighlight?: boolean;
	// readonly deathrattleHighlight?: boolean;
	// readonly tauntHighlight?: boolean;
	// readonly divineShieldHighlight?: boolean;
	// readonly endOfTurnHighlight?: boolean;
	// readonly rebornHighlight?: boolean;
	// readonly bgSpellHighlight?: boolean;
	// readonly hasDeathrattle?: boolean;
	// readonly hasDivineShield?: boolean;

	// readonly highlightBattlecryTooltip?: string;
	// readonly highlightDeathrattleTooltip?: string;
	// readonly highlightTauntTooltip?: string;
	// readonly divineShieldHighlightTooltip?: string;
	// readonly endOfTurnHighlightTooltip?: string;
	// readonly rebornHighlightTooltip?: string;

	readonly hidePins?: boolean;
	readonly faded?: boolean;
}
export interface MinionHighlight {
	readonly mechanic: GameTag;
	readonly label: string;
	readonly hasMechanics: boolean;
	readonly highlighted: boolean;
	readonly tooltip: string;
}

const enhanceCardName = (card: ReferenceCard, group: BgsMinionsGroup): string => {
	if (card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET] && group.tribe) {
	}
	return card.name;
};
