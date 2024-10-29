/* eslint-disable @typescript-eslint/no-non-null-assertion */
// prettier-ignore
import { CardIds } from '@firestone-hs/reference-data';
import { allCounters } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs, toSetting } from '../common';
import { CounterSetting } from './internal/decktracker-settings-internal';

export const decktrackerOpponentDeckSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-opponent-deck',
		name: context.i18n.translateString('settings.decktracker.menu.opponent-deck'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'decktracker-opponent-deck-general',
				title: context.i18n.translateString('settings.decktracker.opponent-deck.tracker-title'),
				settings: [
					{
						type: 'toggle',
						field: 'opponentTracker',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.show-tracker-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.show-tracker-tooltip'),
					},
					{
						type: 'toggle',
						field: 'opponentLoadKnownDecklist',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.known-decklist-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.known-decklist-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker,
					},
					{
						type: 'toggle',
						field: 'opponentLoadAiDecklist',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.ai-decklist-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.ai-decklist-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker,
					},
					{
						type: 'toggle',
						field: 'opponentOverlayGroupByZone',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.group-cards-by-zone-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.group-cards-by-zone-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker,
					},
					{
						type: 'toggle',
						field: 'opponentOverlayCardsGoToBottom',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.used-cards-go-to-bottom-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.used-cards-go-to-bottom-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker || prefs.opponentOverlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'opponentOverlayDarkenUsedCards',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.darken-used-cards-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.darken-used-cards-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker || !prefs.opponentOverlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'opponentOverlayShowGlobalEffects',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.global-effects-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.global-effects-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker || !prefs.opponentOverlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'opponentOverlaySortByManaInOtherZone',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.sort-by-mana-cost-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.sort-by-mana-cost-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker || !prefs.opponentOverlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'opponentOverlayShowTopCardsSeparately',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.show-top-cards-separately-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.show-top-cards-separately-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker || !prefs.opponentOverlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'opponentOverlayShowBottomCardsSeparately',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.show-bottom-cards-separately-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.show-bottom-cards-separately-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker || !prefs.opponentOverlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'opponentOverlayShowDkRunes',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.show-dk-runes-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.show-dk-runes-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker,
					},
					{
						type: 'toggle',
						field: 'opponentOverlayHideGeneratedCardsInOtherZone',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.hide-generated-cards-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.hide-generated-cards-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker,
					},
					{
						type: 'toggle',
						field: 'hideOpponentDecktrackerWhenFriendsListIsOpen',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.hide-when-friends-list-open'),
						tooltip: context.i18n.translateString('settings.battlegrounds.session-widget.hide-when-friends-list-open-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.opponentTracker,
					},
				],
			},
			{
				id: 'decktracker-opponent-deck-hand-tracking',
				title: context.i18n.translateString('settings.decktracker.opponent-deck.opponent-hand-title'),
				settings: [
					{
						type: 'toggle',
						field: 'dectrackerShowOpponentTurnDraw',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.card-turn-draw-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.card-turn-draw-tooltip'),
					},
					{
						type: 'toggle',
						field: 'dectrackerShowOpponentGuess',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.guessed-cards-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.guessed-cards-tooltip'),
					},
					{
						type: 'toggle',
						field: 'dectrackerShowOpponentBuffInHand',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.buff-in-hand-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.buff-in-hand-tooltip'),
					},
					{
						type: 'slider',
						field: 'decktrackerOpponentHandScale',
						label: context.i18n.translateString('settings.decktracker.mulligan.size'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.dectrackerShowOpponentTurnDraw && !prefs.dectrackerShowOpponentGuess && !prefs.dectrackerShowOpponentBuffInHand,
						sliderConfig: {
							min: 60,
							max: 100,
							snapSensitivity: 5,
							knobs: handSizeKnobs(context),
						},
					},
				],
			},
			{
				id: 'decktracker-opponent-deck-secrets-helper',
				title: context.i18n.translateString('settings.decktracker.opponent-deck.secrets-helper-title'),
				settings: [
					{
						type: 'toggle',
						field: 'secretsHelper',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.enable-secret-helper-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.enable-secret-helper-tooltip'),
					},
					{
						type: 'slider',
						field: 'secretsHelperScale',
						label: context.i18n.translateString('settings.decktracker.mulligan.size'),
						tooltip: null,
						sliderConfig: {
							min: 60,
							max: 100,
							snapSensitivity: 5,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
			{
				id: 'decktracker-opponent-deck-size',
				title: context.i18n.translateString('settings.decktracker.opponent-deck.size-title'),
				settings: [
					{
						type: 'slider',
						field: 'opponentOverlayScale',
						label: context.i18n.translateString('settings.decktracker.mulligan.size'),
						tooltip: null,
						sliderConfig: {
							min: 30,
							max: 200,
							snapSensitivity: 5,
							knobs: sizeKnobs(context),
						},
					},
					{
						type: 'slider',
						field: 'opponentOverlayOpacityInPercent',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.opacity-title'),
						tooltip: null,
						sliderConfig: {
							min: 40,
							max: 100,
							snapSensitivity: 1,
							showCurrentValue: true,
						},
					},
				],
			},
			{
				id: 'decktracker-opponent-deck-counters',
				title: context.i18n.translateString('settings.decktracker.opponent-deck.counters.title'),
				settings: counters(context).map((counter) => toSetting(counter)),
			},
			{
				id: 'decktracker-counters-size',
				title: context.i18n.translateString('settings.decktracker.global.counters-size'),
				settings: [
					{
						type: 'slider',
						field: 'countersScaleOpponent',
						label: context.i18n.translateString('settings.decktracker.global.counters-size'),
						tooltip: null,
						sliderConfig: {
							min: 60,
							max: 140,
							snapSensitivity: 5,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
		],
	};
};

const counters = (context: SettingContext): readonly CounterSetting[] => rawCounters(context).sort((a, b) => a.label.localeCompare(b.label));
const rawCounters = (context: SettingContext): CounterSetting[] => [
	{
		id: 'galakrond',
		field: 'opponentGalakrondCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.galakrond-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.galakrond-tooltip'),
	},
	{
		id: 'pogo',
		field: 'opponentPogoCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.pogo-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.pogo-tooltip'),
	},
	{
		id: 'astralAutomaton',
		field: 'opponentAstralAutomatonCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.astral-automaton-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.astral-automaton-tooltip'),
	},
	{
		id: 'earthenGolem',
		field: 'opponentEarthenGolemCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.earthen-golem-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.earthen-golem-tooltip'),
	},
	{
		id: 'multicaster',
		field: 'opponentMulticasterCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.multicaster-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.multicaster-tooltip'),
	},
	{
		id: 'chaoticTendril',
		field: 'opponentChaoticTendrilCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.chaotic-tendril-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.chaotic-tendril-tooltip'),
		showLimitedOption: true,
	},
	{
		id: 'jade',
		field: 'opponentJadeGolemCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.jade-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.jade-tooltip'),
	},
	{
		id: 'number-of-spells',
		field: 'opponentSpellCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.number-of-spells-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.number-of-spells-tooltip'),
	},
	{
		id: 'cthun',
		field: 'opponentCthunCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.cthun-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.cthun-tooltip'),
	},
	{
		id: 'fatigue',
		field: 'opponentFatigueCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.fatigue-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.fatigue-tooltip'),
	},
	{
		id: 'abyssal-curse',
		field: 'opponentAbyssalCurseCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.abyssal-curse-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.abyssal-curse-tooltip'),
	},
	{
		id: 'attack-on-board',
		field: 'opponentAttackCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.attack-on-board-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.attack-on-board-tooltip'),
	},
	{
		id: 'watch-post',
		field: 'opponentWatchpostCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.watch-post-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.watch-post-tooltip'),
	},
	{
		id: 'libram',
		field: 'opponentLibramCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.libram-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.libram-tooltip'),
	},
	{
		id: 'elwynn-boar',
		field: 'opponentElwynnBoarCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.elwynn-boar-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.elwynn-boar-tooltip'),
	},
	{
		id: 'volatile-skeleton',
		field: 'opponentVolatileSkeletonCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.volatile-skeleton-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.volatile-skeleton-tooltip'),
	},
	{
		id: 'relic',
		field: 'opponentRelicCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.relic-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.relic-tooltip'),
	},
	{
		id: 'hero-power-damage',
		field: 'opponentHeroPowerDamageCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.hero-power-damage-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.hero-power-damage-tooltip'),
	},
	{
		id: 'anachronos',
		field: 'opponentAnachronosCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.anachronos-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.anachronos-tooltip'),
	},
	{
		id: 'bonelord-frostwhisper',
		field: 'opponentBonelordFrostwhisperCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.bonelord-frostwhisper-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.bonelord-frostwhisper-tooltip'),
	},
	{
		id: 'shockspitter',
		field: 'opponentShockspitterCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.shockspitter-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.shockspitter-tooltip'),
	},
	{
		id: 'corpse-spent',
		field: 'opponentCorpseSpentCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.corpse-spent-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.corpse-spent-tooltip'),
	},
	{
		id: 'excavate',
		field: 'opponentExcavateCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.excavate-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.excavate-tooltip'),
		showLimitedOption: true,
	},
	{
		id: 'wheelOfDeath',
		field: 'opponentWheelOfDeathCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.wheel-of-death-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.wheel-of-death-tooltip', {
			cardName: context.allCards.getCard(CardIds.WheelOfDeath_TOY_529).name,
		}),
		showLimitedOption: true,
	},
	{
		id: 'deadMinionsThisGame',
		field: 'opponentDeadMinionsThisGameCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.dead-minions-this-game-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.dead-minions-this-game-tooltip'),
	},
	// {
	// 	id: 'dragonsSummoned',
	// 	field: 'opponentDragonsSummonedCounter',
	// 	label: context.i18n.translateString('settings.decktracker.your-deck.counters.dragons-summoned-label'),
	// 	tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.dragons-summoned-tooltip'),
	// 	showLimitedOption: false,
	// },
	{
		id: 'elementalStreak',
		field: 'opponentElementalStreakCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.elemental-streak-label'),
		tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.counters.elemental-streak-tooltip'),
		showLimitedOption: false,
	},
	...allCounters(context.i18n, context.allCards)
		.filter((counter) => counter.opponent?.pref)
		.map((counter) => ({
			id: counter.id,
			field: counter.opponent!.pref,
			label: counter.opponent!.setting.label(context.i18n),
			tooltip: counter.opponent!.setting.tooltip(context.i18n),
		})),
];

const handSizeKnobs = (context: SettingContext) => [
	{
		absoluteValue: 100,
		label: context.i18n.translateString('settings.global.knob-sizes.default'),
	},
];
