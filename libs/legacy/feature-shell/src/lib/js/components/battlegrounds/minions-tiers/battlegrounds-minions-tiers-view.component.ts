import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import {
	BUDDIES_TRIBE_REQUIREMENTS,
	CardIds,
	CardType,
	GameTag,
	NON_DISCOVERABLE_BUDDIES,
	Race,
	ReferenceCard,
	getTribeIcon,
	getTribeName,
} from '@firestone-hs/reference-data';
import { groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { compareTribes, getBuddy, getEffectiveTribes, isBgsSpell } from '../../../services/battlegrounds/bgs-utils';

@Component({
	selector: 'battlegrounds-minions-tiers-view',
	styleUrls: [
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/battlegrounds-minions-tiers-view.component.scss',
	],
	template: `
		<div class="battlegrounds-minions-tiers" (mouseleave)="onTavernMouseLeave()">
			<div class="tiers-container">
				<ng-container>
					<div class="logo-container" *ngIf="currentTurn && showTurnNumber">
						<div class="background-main-part"></div>
						<div class="background-second-part"></div>
						<div
							class="turn-number"
							[owTranslate]="'battlegrounds.battle.turn'"
							[translateParams]="{ value: currentTurn }"
						></div>
					</div>
					<ng-container *ngIf="showMinionsList">
						<ul class="tiers tier-levels">
							<div
								class="tier {{ currentTier.tavernTier }}"
								*ngFor="let currentTier of tierLevels; trackBy: trackByFn"
								[ngClass]="{
									selected: displayedTier && displayedTier.tavernTier === currentTier.tavernTier,
									locked: isLocked(currentTier)
								}"
								[helpTooltip]="currentTier.tooltip"
								(mouseover)="onTavernMouseOver(currentTier)"
								(click)="onTavernClick(currentTier)"
							>
								<img
									class="icon"
									src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs/star.png"
								/>
								<div class="number">{{ currentTier.tavernTier }}</div>
							</div>
						</ul>
						<ul class="tiers mechanical" *ngIf="!!mechanicalTiers?.length">
							<div
								class="tier {{ currentTier.tavernTier }} mechanics"
								*ngFor="let currentTier of mechanicalTiers; trackBy: trackByFn"
								[ngClass]="{
									selected: displayedTier && displayedTier.tavernTier === currentTier.tavernTier,
									locked: isLocked(currentTier)
								}"
								[helpTooltip]="currentTier.tooltip"
								(mouseover)="onTavernMouseOver(currentTier)"
								(click)="onTavernClick(currentTier)"
							>
								<img
									class="icon"
									src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs/star.png"
								/>
								<div class="number">{{ currentTier.tavernTier }}</div>
							</div>
						</ul>
						<ul class="tiers tribe" *ngIf="!!tribeTiers?.length">
							<div
								class="tier {{ currentTier.tavernTier }} tribe"
								*ngFor="let currentTier of tribeTiers; trackBy: trackByFn"
								[ngClass]="{
									selected: displayedTier && displayedTier.tavernTier === currentTier.tavernTier,
									locked: isLocked(currentTier)
								}"
								[helpTooltip]="currentTier.tooltip"
								(mouseover)="onTavernMouseOver(currentTier)"
								(click)="onTavernClick(currentTier)"
							>
								<img class="icon" [src]="currentTier.tavernTierIcon" />
							</div>
						</ul>
						<bgs-minions-list
							*ngFor="let tier of allTiers; trackBy: trackByFn"
							class="minions-list"
							[ngClass]="{
								active:
									tier.tavernTier === displayedTier?.tavernTier ||
									tier.tavernTier === lockedTier?.tavernTier
							}"
							[tier]="tier"
							[showTribesHighlight]="showTribesHighlight"
							[showBattlecryHighlight]="showBattlecryHighlight"
							[highlightedMinions]="highlightedMinions"
							[highlightedTribes]="highlightedTribes"
							[highlightedMechanics]="highlightedMechanics"
							[showGoldenCards]="showGoldenCards"
							[showSpellsAtBottom]="showSpellsAtBottom"
						></bgs-minions-list>
					</ng-container>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsMinionsTiersViewOverlayComponent {
	tierLevels: readonly Tier[] = [];
	mechanicalTiers: readonly Tier[] = [];
	tribeTiers: readonly Tier[] = [];
	allTiers: readonly Tier[] = [];

	@Input() highlightedTribes: readonly Race[];
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() highlightedMinions: readonly string[];
	@Input() currentTurn: number;
	@Input() showTribesHighlight: boolean;
	@Input() showBattlecryHighlight: boolean;
	@Input() showMinionsList: boolean;
	@Input() showTurnNumber: boolean;
	@Input() showMechanicsTiers: boolean;
	@Input() enableMouseOver: boolean;
	@Input() showGoldenCards: boolean;
	@Input() showSpellsAtBottom: boolean;

	@Input() set tiers(value: readonly Tier[]) {
		if (!value) {
			return;
		}
		this.tierLevels = value.filter((t) => t.type === 'standard');
		this.mechanicalTiers = value.filter((t) => t.type === 'mechanics');
		this.tribeTiers = value.filter((t) => t.type === 'tribe');
		this.allTiers = [...this.tierLevels, ...this.mechanicalTiers, ...this.tribeTiers];
		// console.debug('allTiers', this.allTiers);
	}

	@Input() set tavernTier(value: number) {
		if (!value) {
			return;
		}

		// Only update the tavern tier if it's locked to the current tavern tier
		// so that we don't change the display if the user wants to keep the focus on another
		// tier (eg tier 5 or 6 to see their endgame options)
		if (!!this.lockedTier && this.lockedTier.tavernTier === this.currentTavernTier) {
			this.lockedTier = this.allTiers.find((t) => t.tavernTier === value);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
		this.currentTavernTier = value;
	}

	displayedTier: Tier;
	lockedTier: Tier;
	currentTavernTier: number;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	trackByFn(index: number, tavernTier: Tier) {
		return tavernTier?.tavernTier;
	}

	onTavernClick(tavernTier: Tier) {
		this.displayedTier = tavernTier;
		if (this.isLocked(tavernTier)) {
			this.lockedTier = undefined;
			this.displayedTier = undefined;
		} else {
			this.lockedTier = tavernTier;
			this.displayedTier = undefined;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseOver(tavernTier: Tier) {
		if (this.lockedTier || !this.enableMouseOver) {
			return;
		}

		this.displayedTier = tavernTier;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTavernMouseLeave() {
		if (this.lockedTier) {
			return;
		}
		this.displayedTier = undefined;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	isLocked(tavernTier: Tier) {
		return this.lockedTier && tavernTier && this.lockedTier.tavernTier === tavernTier.tavernTier;
	}
}

export interface Tier {
	tavernTier: number | 'B' | 'D' | 'DS' | 'T' | 'E' | 'R' | 'Buds' | string;
	tavernTierIcon?: string;
	cards: readonly ExtendedReferenceCard[];
	groupingFunction: (card: ExtendedReferenceCard) => readonly string[];
	tooltip?: string;
	type: 'standard' | 'mechanics' | 'tribe';
}

export interface ExtendedReferenceCard extends ReferenceCard {
	readonly banned?: boolean;
}

export const buildTiers = (
	cardsInGame: readonly ReferenceCard[],
	groupMinionsIntoTheirTribeGroup: boolean,
	showMechanicsTiers: boolean,
	showTribeTiers: boolean,
	showTierSeven: boolean,
	showTrinkets: boolean,
	availableTribes: readonly Race[],
	anomalies: readonly string[],
	playerCardId: string,
	allPlayerCardIds: readonly string[],
	hasBuddies: boolean,
	hasSpells: boolean,
	hasTrinkets: boolean,
	playerTrinkets: readonly string[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	allCards: CardsFacadeService,
): readonly Tier[] => {
	if (!cardsInGame?.length) {
		return [];
	}

	anomalies = anomalies ?? [];
	availableTribes = availableTribes ?? [];
	allPlayerCardIds = allPlayerCardIds ?? [];
	let tiersToInclude = [1, 2, 3, 4, 5, 6];
	if (
		showTierSeven ||
		anomalies.includes(CardIds.SecretsOfNorgannon_BG27_Anomaly_504) ||
		playerCardId === CardIds.ThorimStormlord_BG27_HERO_801 ||
		playerTrinkets?.includes(CardIds.PaglesFishingRod_BG30_MagicItem_993)
	) {
		tiersToInclude.push(7);
	}
	if (anomalies.includes(CardIds.BigLeague_BG27_Anomaly_100)) {
		tiersToInclude = [3, 4, 5, 6];
	}
	if (anomalies.includes(CardIds.LittleLeague_BG27_Anomaly_800)) {
		tiersToInclude = [1, 2, 3, 4];
	}
	if (anomalies.includes(CardIds.WhatAreTheOddsquestion_BG27_Anomaly_101)) {
		tiersToInclude = [1, 3, 5];
	}
	if (anomalies.includes(CardIds.HowToEvenquestionquestion_BG27_Anomaly_102)) {
		tiersToInclude = [2, 4, 6];
	}
	if (anomalies.includes(CardIds.ValuationInflation_BG27_Anomaly_556)) {
		tiersToInclude = tiersToInclude.filter((tier) => tier !== 1);
	}
	// console.debug('tiersToInclude', tiersToInclude, anomalies, playerCardId);

	const filteredCards: readonly ExtendedReferenceCard[] = cardsInGame
		.filter(
			(card) =>
				tiersToInclude.includes(card.techLevel) ||
				card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET],
		)
		.map((card) =>
			isCardExcludedByAnomaly(card, anomalies)
				? {
						...card,
						banned: true,
				  }
				: card,
		);
	const groupedByTier: { [tierLevel: string]: readonly ExtendedReferenceCard[] } = groupByFunction(
		(card: ExtendedReferenceCard) => '' + card.techLevel,
	)(filteredCards);

	// Add a tier with all the buddies
	const showAllBuddyCards =
		hasBuddies ||
		anomalies.includes(CardIds.BringInTheBuddies_BG27_Anomaly_810) ||
		playerCardId === CardIds.ETCBandManager_BG25_HERO_105;
	const showBuddiesTier =
		showAllBuddyCards ||
		(hasBuddies &&
			[CardIds.TessGreymane_TB_BaconShop_HERO_50, CardIds.ScabbsCutterbutter_BG21_HERO_010].includes(
				playerCardId as CardIds,
			));
	const allBuddies = allCards
		.getCards()
		.filter((c) => !!c.techLevel)
		.filter((c) => !!c.battlegroundsPremiumDbfId)
		.filter((card) => card.set !== 'Vanilla')
		.filter((card) => card.mechanics?.includes(GameTag[GameTag.BACON_BUDDY]));
	const allPlayerBuddies = allPlayerCardIds
		.map((p) => getBuddy(p as CardIds, allCards))
		.map((b) => allCards.getCard(b));
	const allPlayerBuddiesCardIds = allPlayerBuddies.map((b) => b.id);
	const buddies: readonly ReferenceCard[] = !showBuddiesTier
		? []
		: showAllBuddyCards
		? allBuddies
				.filter(
					(b) =>
						allPlayerBuddiesCardIds.includes(b.id) || !NON_DISCOVERABLE_BUDDIES.includes(b.id as CardIds),
				)
				.filter(
					(b) =>
						!BUDDIES_TRIBE_REQUIREMENTS.find((req) => b.id === req.buddy) ||
						availableTribes.includes(BUDDIES_TRIBE_REQUIREMENTS.find((req) => b.id === req.buddy).tribe),
				)
		: // For tess, only show the buddies of the opponents
		[CardIds.TessGreymane_TB_BaconShop_HERO_50, CardIds.ScabbsCutterbutter_BG21_HERO_010].includes(
				playerCardId as CardIds,
		  )
		? allPlayerBuddies
		: [];
	const standardTiers: readonly Tier[] = Object.keys(groupedByTier)
		.filter((tier) => !isNaN(+tier))
		.map((tierLevel) => ({
			tavernTier: parseInt(tierLevel),
			cards: groupedByTier[tierLevel],
			groupingFunction: (card: ExtendedReferenceCard) => {
				if (hasSpells && isBgsSpell(card)) {
					return ['spell'];
				}
				return getEffectiveTribes(card, groupMinionsIntoTheirTribeGroup).filter(
					(t) =>
						!availableTribes?.length ||
						availableTribes.includes(Race[t]) ||
						Race[t] === Race.BLANK ||
						Race[t] === Race.ALL,
				);
			},
			type: 'standard',
		}));
	const mechanicsTiers = showMechanicsTiers ? buildMechanicsTiers(filteredCards, buddies, hasSpells, i18n) : [];
	const tribeTiers = showTribeTiers
		? buildTribeTiers(
				filteredCards,
				playerCardId,
				availableTribes,
				buddies,
				hasSpells,
				hasTrinkets && showTrinkets,
				groupMinionsIntoTheirTribeGroup,
				i18n,
				allCards,
		  )
		: [];
	return [...standardTiers, ...mechanicsTiers, ...tribeTiers];
};

const buildTribeTiers = (
	cardsInGame: readonly ExtendedReferenceCard[],
	playerCardId: string,
	availableTribes: readonly Race[],
	allBuddies: readonly ExtendedReferenceCard[],
	hasSpells: boolean,
	hasTrinkets: boolean,
	groupMinionsIntoTheirTribeGroup: boolean,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
	allCards: CardsFacadeService,
): readonly Tier[] => {
	if (!availableTribes?.length) {
		return [];
	}
	// console.debug('building tribe tiers', cardsInGame, playerCardId, availableTribes, allBuddies);
	const allTribes: Race[] = [
		...new Set(
			cardsInGame
				.flatMap((card) => card.races ?? [])
				.filter((t) => t !== Race[Race.ALL] && availableTribes.includes(Race[t])),
		),
	].map((t) => Race[t]);
	// console.debug('[tribe-tiers] all tribes', allTribes, availableTribes);
	const tribesResult = allTribes
		.map((tribe: Race) => {
			const cardsForTribe = cardsInGame.filter((c) =>
				getEffectiveTribes(c, groupMinionsIntoTheirTribeGroup)?.includes(Race[tribe]),
			);
			const result: Tier = {
				tavernTier: tribe,
				tavernTierIcon: getTribeIcon(tribe),
				tooltip: getTribeName(tribe, i18n),
				cards: cardsForTribe,
				groupingFunction: (card: ReferenceCard) => ['' + card.techLevel],
				type: 'tribe',
			};
			return result;
		})
		.sort((a, b) => {
			return compareTribes(a.tavernTier as Race, b.tavernTier as Race, i18n);
		});
	const spellsTier: Tier = !hasSpells
		? null
		: {
				tavernTier: 'spell',
				tavernTierIcon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.CarefulInvestment_BG28_800}.jpg`,
				tooltip: 'Spells',
				cards: cardsInGame.filter((c) => c.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL]),
				groupingFunction: (card: ReferenceCard) => ['' + card.techLevel],
				type: 'tribe',
		  };
	const trinketsTier: Tier = !hasTrinkets
		? null
		: {
				tavernTier: 'trinket',
				tavernTierIcon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.JarOGems_BG30_MagicItem_546}.jpg`,
				tooltip: 'Trinkets',
				cards: cardsInGame.filter(
					(c) => c.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET] && !!c.spellSchool,
				),
				groupingFunction: (card: ReferenceCard) => [card.spellSchool],
				type: 'tribe',
		  };
	return [...tribesResult, spellsTier, trinketsTier].filter((tier) => tier);
};

const buildMechanicsTiers = (
	cardsInGame: readonly ExtendedReferenceCard[],
	allBuddies: readonly ExtendedReferenceCard[],
	hasSpells: boolean,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): readonly Tier[] => {
	const mechanicalTiers: Tier[] = [
		{
			tavernTier: 'B',
			cards: cardsInGame.filter((c) => isInMechanicalTier(c, GameTag.BATTLECRY)),
			groupingFunction: (card: ReferenceCard) => ['' + card.techLevel],
			tooltip: i18n.translateString('battlegrounds.in-game.minions-list.mechanics-tier-tooltip', {
				value: i18n.translateString(`global.mechanics.${GameTag[GameTag.BATTLECRY].toLowerCase()}`),
			}),
			type: 'mechanics',
		},
		{
			tavernTier: 'D',
			cards: cardsInGame.filter((c) => isInMechanicalTier(c, GameTag.DEATHRATTLE)),
			groupingFunction: (card: ReferenceCard) => ['' + card.techLevel],
			tooltip: i18n.translateString('battlegrounds.in-game.minions-list.mechanics-tier-tooltip', {
				value: i18n.translateString(`global.mechanics.${GameTag[GameTag.DEATHRATTLE].toLowerCase()}`),
			}),
			type: 'mechanics',
		},
		{
			tavernTier: 'DS',
			cards: [
				...cardsInGame.filter((c) => isInMechanicalTier(c, GameTag.DIVINE_SHIELD)),
				cardsInGame.find((c) => c.id === CardIds.Glowscale_BG23_008),
			],
			groupingFunction: (card: ReferenceCard) => ['' + card.techLevel],
			tooltip: i18n.translateString('battlegrounds.in-game.minions-list.mechanics-tier-tooltip', {
				value: i18n.translateString(`global.mechanics.${GameTag[GameTag.DIVINE_SHIELD].toLowerCase()}`),
			}),
			type: 'mechanics',
		},
		{
			tavernTier: 'T',
			cards: cardsInGame.filter((c) => isInMechanicalTier(c, GameTag.TAUNT)),
			groupingFunction: (card: ReferenceCard) => ['' + card.techLevel],
			tooltip: i18n.translateString('battlegrounds.in-game.minions-list.mechanics-tier-tooltip', {
				value: i18n.translateString(`global.mechanics.${GameTag[GameTag.TAUNT].toLowerCase()}`),
			}),
			type: 'mechanics',
		},
		{
			tavernTier: 'E',
			cards: cardsInGame.filter((c) => isInMechanicalTier(c, GameTag.END_OF_TURN)),
			groupingFunction: (card: ReferenceCard) => ['' + card.techLevel],
			tooltip: i18n.translateString('battlegrounds.in-game.minions-list.mechanics-tier-tooltip', {
				value: i18n.translateString(`global.mechanics.${GameTag[GameTag.END_OF_TURN].toLowerCase()}`),
			}),
			type: 'mechanics',
		},
		{
			tavernTier: 'R',
			cards: cardsInGame.filter((c) => isInMechanicalTier(c, GameTag.REBORN)),
			groupingFunction: (card: ReferenceCard) => ['' + card.techLevel],
			tooltip: i18n.translateString('battlegrounds.in-game.minions-list.mechanics-tier-tooltip', {
				value: i18n.translateString(`global.mechanics.${GameTag[GameTag.REBORN].toLowerCase()}`),
			}),
			type: 'mechanics',
		},
	];
	if (hasSpells) {
		mechanicalTiers.push({
			tavernTier: 'S',
			cards: cardsInGame.filter((c) => isInMechanicalTier(c, GameTag.BG_SPELL)),
			groupingFunction: (card: ReferenceCard) => ['' + card.techLevel],
			tooltip: i18n.translateString('battlegrounds.in-game.minions-list.mechanics-tier-tooltip', {
				value: i18n.translateString(`global.mechanics.${GameTag[GameTag.BG_SPELL].toLowerCase()}`),
			}),
			type: 'mechanics',
		});
	}
	if (allBuddies.length) {
		mechanicalTiers.push({
			tavernTier: 'Buds',
			cards: allBuddies,
			groupingFunction: (card: ReferenceCard) => ['' + card.techLevel],
			tooltip: i18n.translateString('battlegrounds.in-game.minions-list.buddies-tier-tooltip'),
			type: 'mechanics',
		});
	}

	return mechanicalTiers;
};

const isInMechanicalTier = (card: ReferenceCard, mechanic: GameTag): boolean =>
	card.mechanics?.includes(GameTag[mechanic]) || card.referencedTags?.includes(GameTag[mechanic]);

const isCardExcludedByAnomaly = (card: ReferenceCard, anomalies: readonly string[]): boolean => {
	if (anomalies.includes(CardIds.UncompensatedUpset_BG27_Anomaly_721)) {
		return [
			CardIds.CorpseRefiner_BG25_033,
			CardIds.CorpseRefiner_BG25_033_G,
			CardIds.TimeSaver_BG27_520,
			CardIds.TimeSaver_BG27_520_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.PackedStands_BG27_Anomaly_750)) {
		return [CardIds.SeabornSummoner_BG27_012, CardIds.SeabornSummoner_BG27_012_G].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.FalseIdols_BG27_Anomaly_301)) {
		return [CardIds.TreasureSeekerElise_BG23_353, CardIds.TreasureSeekerElise_BG23_353_G].includes(
			card.id as CardIds,
		);
	} else if (anomalies.includes(CardIds.TheGoldenArena_BG27_Anomaly_801)) {
		return [
			CardIds.TreasureSeekerElise_BG23_353,
			CardIds.TreasureSeekerElise_BG23_353_G,
			CardIds.CaptainSanders_BG25_034,
			CardIds.CaptainSanders_BG25_034_G,
			CardIds.UpbeatImpressionist_BG26_124,
			CardIds.UpbeatImpressionist_BG26_124_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.AFaireReward_BG27_Anomaly_755)) {
		return [CardIds.TreasureSeekerElise_BG23_353, CardIds.TreasureSeekerElise_BG23_353_G].includes(
			card.id as CardIds,
		);
	} else if (
		anomalies.some((a) =>
			[
				CardIds.OopsAllBeastsToken_BG27_Anomaly_104t,
				CardIds.OopsAllDemonsToken_BG27_Anomaly_104t2,
				CardIds.OopsAllDragonsToken_BG27_Anomaly_104t3,
				CardIds.OopsAllElementalsToken_BG27_Anomaly_104t4,
				CardIds.OopsAllEvil_BG27_Anomaly_307,
				CardIds.OopsAllMechsToken_BG27_Anomaly_104t5,
				CardIds.OopsAllMurlocsToken_BG27_Anomaly_104t6,
				CardIds.OopsAllNagaToken_BG27_Anomaly_104t7,
				CardIds.OopsAllPiratesToken_BG27_Anomaly_104t10,
				CardIds.OopsAllQuilboarToken_BG27_Anomaly_104t8,
			].includes(a as CardIds),
		)
	) {
		return [
			CardIds.MenagerieMug_BGS_082,
			CardIds.MenagerieMug_TB_BaconUps_144,
			CardIds.MenagerieJug_BGS_083,
			CardIds.MenagerieJug_TB_BaconUps_145,
			CardIds.ReefExplorer_BG23_016,
			CardIds.ReefExplorer_BG23_016_G,
			CardIds.LivingConstellation_BG27_001,
			CardIds.LivingConstellation_BG27_001_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.BigLeague_BG27_Anomaly_100)) {
		return [
			CardIds.TheBoogieMonster_BG26_176,
			CardIds.TheBoogieMonster_BG26_176_G,
			CardIds.PatientScout_BG24_715,
			CardIds.PatientScout_BG24_715_G,
			CardIds.FacelessDisciple_BG24_719,
			CardIds.FacelessDisciple_BG24_719_G,
			CardIds.KingVarian_BG27_508,
			CardIds.KingVarian_BG27_508_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.LittleLeague_BG27_Anomaly_800)) {
		return [
			CardIds.TheBoogieMonster_BG26_176,
			CardIds.TheBoogieMonster_BG26_176_G,
			CardIds.PatientScout_BG24_715,
			CardIds.PatientScout_BG24_715_G,
			CardIds.FacelessDisciple_BG24_719,
			CardIds.FacelessDisciple_BG24_719_G,
			CardIds.KingVarian_BG27_508,
			CardIds.KingVarian_BG27_508_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.GolgannethsTempest_BG27_Anomaly_900)) {
		return [CardIds.TreasureSeekerElise_BG23_353, CardIds.TreasureSeekerElise_BG23_353_G].includes(
			card.id as CardIds,
		);
	} else if (anomalies.includes(CardIds.ShacklesOfThePrimus_BG27_Anomaly_724)) {
		return [
			CardIds.PatientScout_BG24_715,
			CardIds.PatientScout_BG24_715_G,
			CardIds.UpbeatDuo_BG26_199,
			CardIds.UpbeatDuo_BG26_199_G,
			CardIds.UpbeatFlutist_BG26_352,
			CardIds.UpbeatFlutist_BG26_352_G,
			CardIds.UpbeatUpstart_BG26_120,
			CardIds.UpbeatUpstart_BG26_120_G,
			CardIds.UpbeatFrontdrake_BG26_529,
			CardIds.UpbeatFrontdrake_BG26_529_G,
			CardIds.UpbeatImpressionist_BG26_124,
			CardIds.UpbeatImpressionist_BG26_124_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.CurseOfAggramar_BG27_Anomaly_006)) {
		return [CardIds.Dreadbeard_BG27_011, CardIds.Dreadbeard_BG27_011_G].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.TavernSpecial_BG27_Anomaly_103)) {
		return [CardIds.SeabornSummoner_BG27_012, CardIds.SeabornSummoner_BG27_012_G].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.ValuationInflation_BG27_Anomaly_556)) {
		return [CardIds.TreasureSeekerElise_BG23_353, CardIds.TreasureSeekerElise_BG23_353_G].includes(
			card.id as CardIds,
		);
	}
	return false;
};
