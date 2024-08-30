import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CardType, GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { ExtendedReferenceCard, isBgsTrinket } from '@firestone/battlegrounds/core';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, filter } from 'rxjs';
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
			[ngClass]="{ banned: minion.banned, locked: minion.trinketLocked }"
			[cardTooltip]="minion.displayedCardIds"
			[cardTooltipRelatedCardIds]="minion.relatedCardIds"
			[cardTooltipBgs]="true"
			[helpTooltip]="minion.bannedReason ?? minion.trinketLockedReason"
		>
			<img class="icon" [src]="minion.image" [cardTooltip]="minion.cardId" />
			<div class="name">
				<div class="gold-cost" *ngIf="minion.goldCost != null">
					<img
						class="icon"
						src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/coin_mana.png"
					/>
					<div class="cost">{{ minion.goldCost }}</div>
				</div>
				<span class="name-text">
					{{ minion.name }}
				</span>
			</div>
			<minion-highlight-buttons
				class="highlight-buttons"
				*ngIf="showTribesHighlight && !minion.hidePins"
				[minion]="minion"
			></minion-highlight-buttons>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionItemComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	minion$: Observable<Minion>;

	@Input() set minion(value: ExtendedReferenceCard) {
		this.minion$$.next(value);
	}
	@Input() set showGoldenCards(value: boolean) {
		this.showGoldenCards$$.next(value);
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

	@Input() showTribesHighlight: boolean;

	private minion$$ = new BehaviorSubject<ExtendedReferenceCard | null>(null);
	private showGoldenCards$$ = new BehaviorSubject<boolean>(true);
	private highlightedMinions$$ = new BehaviorSubject<readonly string[]>([]);
	private highlightedTribes$$ = new BehaviorSubject<readonly Race[]>([]);
	private highlightedMechanics$$ = new BehaviorSubject<readonly GameTag[]>([]);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
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
		]).pipe(
			filter(
				([minion, showGoldenCards, highlightedMinions, highlightedTribes, highlightedMechanics]) => !!minion,
			),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			this.mapData(([card, showGoldenCards, highlightedMinions, highlightedTribes, highlightedMechanics]) => {
				const hasBattlecry = card.mechanics?.includes(GameTag[GameTag.BATTLECRY]);
				const hasDeathrattle = card.mechanics?.includes(GameTag[GameTag.DEATHRATTLE]);
				const hasTaunt = card.mechanics?.includes(GameTag[GameTag.TAUNT]);
				const hasDivineShield = card.mechanics?.includes(GameTag[GameTag.DIVINE_SHIELD]);
				const hasEndOfTurn = card.mechanics?.includes(GameTag[GameTag.END_OF_TURN]);
				const hasReborn = card.mechanics?.includes(GameTag[GameTag.REBORN]);
				const hasBgSpell = card.mechanics?.includes(GameTag[GameTag.BG_SPELL]);

				const battlecryHighlight = hasBattlecry && highlightedMechanics.includes(GameTag.BATTLECRY);
				const deathrattleHighlight = hasDeathrattle && highlightedMechanics.includes(GameTag.DEATHRATTLE);
				const tauntHighlight = hasTaunt && highlightedMechanics.includes(GameTag.TAUNT);
				const divineShieldHighlight = hasDivineShield && highlightedMechanics.includes(GameTag.DIVINE_SHIELD);
				const endOfTurnHighlight = hasEndOfTurn && highlightedMechanics.includes(GameTag.END_OF_TURN);
				const rebornHighlight = hasReborn && highlightedMechanics.includes(GameTag.REBORN);
				const bgSpellHighlight = hasBgSpell && highlightedMechanics.includes(GameTag.BG_SPELL);

				const result: Minion = {
					cardId: card.id,
					displayedCardIds: this.buildAllCardIds(card.id, showGoldenCards),
					relatedCardIds: this.buildRelatedCardIds(card.id),
					image: `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.id}.jpg`,
					name: card.name, // Already enhanced when building groups
					highlighted: highlightedMinions.includes(card.id),
					banned: card.banned,
					bannedReason: card.bannedReason,
					goldCost: isBgsSpell(card) || isBgsTrinket(card) ? card.cost : null,
					techLevel: card.techLevel,

					hasBattlecry: hasBattlecry,
					hasDeathrattle: hasDeathrattle,
					hasTaunt: hasTaunt,
					hasDivineShield: hasDivineShield,
					hasEndOfTurn: hasEndOfTurn,
					hasReborn: hasReborn,
					hasBgSpell: hasBgSpell,

					trinketLocked: card.trinketLocked,
					trinketLockedReason: card.trinketLockedReason?.join('<br />'),

					hidePins: isBgsTrinket(card),

					battlecryHighlight: battlecryHighlight,
					deathrattleHighlight: deathrattleHighlight,
					tauntHighlight: tauntHighlight,
					divineShieldHighlight: divineShieldHighlight,
					endOfTurnHighlight: endOfTurnHighlight,
					rebornHighlight: rebornHighlight,
					bgSpellHighlight: bgSpellHighlight,

					hightMinionTooltip: this.i18n.translateString(
						'battlegrounds.in-game.minions-list.highlight-minion',
						{
							value: card.name,
						},
					),
					highlightBattlecryTooltip: battlecryHighlight
						? this.i18n.translateString('battlegrounds.in-game.minions-list.unhighlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.battlecry'),
						  })
						: this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.battlecry'),
						  }),
					highlightDeathrattleTooltip: deathrattleHighlight
						? this.i18n.translateString('battlegrounds.in-game.minions-list.unhighlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.deathrattle'),
						  })
						: this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.deathrattle'),
						  }),
					highlightTauntTooltip: tauntHighlight
						? this.i18n.translateString('battlegrounds.in-game.minions-list.unhighlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.taunt'),
						  })
						: this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.taunt'),
						  }),
					divineShieldHighlightTooltip: divineShieldHighlight
						? this.i18n.translateString('battlegrounds.in-game.minions-list.unhighlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.divine-shield'),
						  })
						: this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.divine-shield'),
						  }),
					endOfTurnHighlightTooltip: endOfTurnHighlight
						? this.i18n.translateString('battlegrounds.in-game.minions-list.unhighlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.end-of-turn'),
						  })
						: this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.end-of-turn'),
						  }),
					rebornHighlightTooltip: rebornHighlight
						? this.i18n.translateString('battlegrounds.in-game.minions-list.unhighlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.reborn'),
						  })
						: this.i18n.translateString('battlegrounds.in-game.minions-list.highlight-mechanics', {
								value: this.i18n.translateString('global.mechanics.reborn'),
						  }),
				};
				return result;
			}),
		);
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
	readonly name: string;
	readonly banned?: boolean;
	readonly bannedReason?: string;
	readonly techLevel?: number;
	readonly goldCost: number;
	readonly highlighted: boolean;
	readonly hasTaunt?: boolean;
	readonly hasEndOfTurn?: boolean;
	readonly hasBattlecry?: boolean;
	readonly hasReborn?: boolean;
	readonly hasBgSpell?: boolean;

	readonly trinketLocked?: boolean;
	readonly trinketLockedReason?: string;

	readonly battlecryHighlight?: boolean;
	readonly deathrattleHighlight?: boolean;
	readonly tauntHighlight?: boolean;
	readonly divineShieldHighlight?: boolean;
	readonly endOfTurnHighlight?: boolean;
	readonly rebornHighlight?: boolean;
	readonly bgSpellHighlight?: boolean;
	readonly hasDeathrattle?: boolean;
	readonly hasDivineShield?: boolean;

	readonly hightMinionTooltip?: string;
	readonly highlightBattlecryTooltip?: string;
	readonly highlightDeathrattleTooltip?: string;
	readonly highlightTauntTooltip?: string;
	readonly divineShieldHighlightTooltip?: string;
	readonly endOfTurnHighlightTooltip?: string;
	readonly rebornHighlightTooltip?: string;

	readonly hidePins?: boolean;
}

const enhanceCardName = (card: ReferenceCard, group: BgsMinionsGroup): string => {
	if (card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET] && group.tribe) {
	}
	return card.name;
};
