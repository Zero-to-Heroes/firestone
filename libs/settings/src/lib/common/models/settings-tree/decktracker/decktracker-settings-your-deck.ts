/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { getAllCounters } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs, toSetting } from '../common';
import { CounterSetting } from './internal/decktracker-settings-internal';

export const decktrackerYourDeckSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-your-deck',
		name: context.i18n.translateString('settings.decktracker.menu.your-deck'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'decktracker-your-deck-general',
				title: context.i18n.translateString('settings.decktracker.opponent-deck.tracker-title'),
				settings: [
					{
						type: 'toggle',
						field: 'overlayGroupByZone',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.group-cards-by-zone-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.group-cards-by-zone-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayCardsGoToBottom',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.used-cards-go-to-bottom-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.used-cards-go-to-bottom-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.overlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'overlayDarkenUsedCards',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.darken-used-cards-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.darken-used-cards-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.overlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'overlayShowGlobalEffects',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.global-effects-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.global-effects-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.overlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'overlayShowDiscoveryZone',
						label: context.i18n.translateString('settings.decktracker.your-deck.discovery-zone-label'),
						tooltip: context.i18n.translateString('settings.decktracker.your-deck.discovery-zone-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.overlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'overlaySortByManaInOtherZone',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.sort-by-mana-cost-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.sort-by-mana-cost-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.overlayGroupByZone,
					},
					{
						type: 'toggle',
						field: 'overlayShowTopCardsSeparately',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.show-top-cards-separately-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.show-top-cards-separately-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowBottomCardsSeparately',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.show-bottom-cards-separately-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.show-bottom-cards-separately-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowDkRunes',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.show-dk-runes-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.show-dk-runes-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayHideGeneratedCardsInOtherZone',
						label: context.i18n.translateString('settings.decktracker.opponent-deck.hide-generated-cards-label'),
						tooltip: context.i18n.translateString('settings.decktracker.opponent-deck.hide-generated-cards-tooltip'),
					},
					{
						type: 'toggle',
						field: 'decktrackerNoDeckMode',
						label: context.i18n.translateString('settings.decktracker.your-deck.ignore-decklist-label'),
						tooltip: context.i18n.translateString('settings.decktracker.your-deck.ignore-decklist-tooltip'),
						advancedSetting: true,
						toggleConfig: {
							messageWhenToggleValue: context.i18n.translateString('settings.decktracker.your-deck.ignore-decklist-confirmation'),
							valueToDisplayMessageOn: true,
						},
					},
				],
			},
			{
				id: 'decktracker-your-deck-size',
				title: context.i18n.translateString('settings.decktracker.opponent-deck.size-title'),
				settings: [
					{
						type: 'slider',
						field: 'decktrackerScale',
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
						field: 'overlayOpacityInPercent',
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
				id: 'decktracker-your-deck-counters',
				title: context.i18n.translateString('settings.decktracker.opponent-deck.counters.title'),
				settings: counters(context).map((counter) => toSetting(counter)),
			},
			{
				id: 'decktracker-counters-size-other',
				title: context.i18n.translateString('settings.decktracker.global.attack-counter-size'),
				settings: [
					{
						type: 'slider',
						field: 'countersScaleOther',
						label: context.i18n.translateString('settings.decktracker.global.counters-size'),
						tooltip: null,
						sliderConfig: {
							min: 30,
							max: 200,
							snapSensitivity: 5,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
			{
				id: 'decktracker-counters-size',
				title: context.i18n.translateString('settings.decktracker.global.counters-size'),
				settings: [
					{
						type: 'slider',
						field: 'countersScale',
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
			{
				id: 'decktracker-max-resources',
				title: context.i18n.translateString('settings.decktracker.max-resources-widget.title'),
				keywords: [context.i18n.translateString('global.hs-terms.health'), context.i18n.translateString('global.hs-terms.mana')],
				settings: [
					{
						type: 'toggle',
						field: 'showPlayerMaxResourcesWidget',
						label: context.i18n.translateString('settings.decktracker.max-resources-widget.toggle'),
						tooltip: context.i18n.translateString('settings.decktracker.max-resources-widget.toggle-tooltip'),
					},
					{
						type: 'toggle',
						field: 'playerMaxResourcesWidgetAlwaysOn',
						label: context.i18n.translateString('settings.decktracker.max-resources-widget.always-on'),
						tooltip: context.i18n.translateString('settings.decktracker.max-resources-widget.always-on-tooltip'),
					},
					{
						type: 'slider',
						field: 'maxResourcesWidgetScale',
						label: context.i18n.translateString('twitch.scale'),
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
		field: 'playerGalakrondCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.galakrond-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.galakrond-tooltip'),
	},
	{
		id: 'pogo',
		field: 'playerPogoCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.pogo-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.pogo-tooltip'),
	},
	{
		id: 'astralAutomaton',
		field: 'playerAstralAutomatonCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.astral-automaton-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.astral-automaton-tooltip'),
	},
	{
		id: 'jade',
		field: 'playerJadeGolemCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.jade-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.jade-tooltip'),
	},
	{
		id: 'cthun',
		field: 'playerCthunCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.cthun-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.cthun-tooltip'),
	},
	{
		id: 'fatigue',
		field: 'playerFatigueCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.fatigue-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.fatigue-tooltip'),
	},
	{
		id: 'abyssal-curse',
		field: 'playerAbyssalCurseCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.abyssal-curse-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.abyssal-curse-tooltip'),
	},
	{
		id: 'attack-on-board',
		field: 'playerAttackCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.attack-on-board-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.attack-on-board-tooltip'),
	},
	{
		id: 'elementals',
		field: 'playerElementalCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.elementals-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.elementals-tooltip'),
	},
	{
		id: 'watch-post',
		field: 'playerWatchpostCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.watch-post-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.watch-post-tooltip'),
	},
	{
		id: 'elwynn-boar',
		field: 'playerElwynnBoarCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.elwynn-boar-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.elwynn-boar-tooltip'),
	},
	{
		id: 'bolner',
		field: 'playerBolnerCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.bolner-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.bolner-tooltip'),
	},
	{
		id: 'brilliant-macaw',
		field: 'playerBrilliantMacawCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.brilliant-macaw-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.brilliant-macaw-tooltip'),
	},
	{
		id: 'monstrous-parrot',
		field: 'playerMonstrousParrotCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.monstrous-parrot-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.monstrous-parrot-tooltip'),
	},
	{
		id: 'vanessa',
		field: 'playerVanessaVanCleefCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.vanessa-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.vanessa-tooltip'),
	},
	{
		id: 'locationsUsed',
		field: 'playerLocationsUsedCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.locations-used-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.locations-used-tooltip'),
	},
	{
		id: 'seaShanty',
		field: 'playerSeaShantyCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.sea-shanty-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.sea-shanty-tooltip'),
	},
	{
		id: 'wheelOfDeath',
		field: 'playerWheelOfDeathCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.wheel-of-death-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.wheel-of-death-tooltip', {
			cardName: context.allCards.getCard(CardIds.WheelOfDeath_TOY_529).name,
		}),
	},
	{
		id: 'thirstyDrifter',
		field: 'playerThirstyDrifterCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.thirsty-drifter-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.thirsty-drifter-tooltip'),
	},
	{
		id: 'cardsPlayedFromAnotherClass',
		field: 'playerCardsPlayedFromAnotherClassCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.cards-played-from-another-class-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.cards-played-from-another-class-tooltip'),
	},
	{
		id: 'elementalStreak',
		field: 'playerElementalStreakCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.elemental-streak-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.elemental-streak-tooltip'),
	},
	{
		id: 'tramHeist',
		field: 'playerTramHeistCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.tram-heist-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.tram-heist-tooltip', {
			cardName: context.allCards.getCard(CardIds.TramHeist_WW_053)?.name,
		}),
	},
	{
		id: 'excavate',
		field: 'playerExcavateCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.excavate-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.excavate-tooltip'),
	},
	{
		id: 'chaoticTendril',
		field: 'playerChaoticTendrilCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.chaotic-tendril-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.chaotic-tendril-tooltip'),
	},
	{
		id: 'secretsPlayed',
		field: 'playerSecretsPlayedCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.secrets-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.secrets-tooltip'),
	},
	{
		id: 'lightray',
		field: 'playerLightrayCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.lightray-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.lightray-tooltip'),
	},
	{
		id: 'holySpells',
		field: 'playerHolySpellsCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.holy-spells-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.holy-spells-tooltip'),
	},
	{
		id: 'menagerie',
		field: 'playerMenagerieCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.menagerie-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.menagerie-tooltip'),
	},
	{
		id: 'corpse-spent',
		field: 'playerCorpseSpentCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.corpse-spent-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.corpse-spent-tooltip'),
	},
	{
		id: 'overdraft',
		field: 'playerOverdraftCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.overdraft-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.overdraft-tooltip'),
	},
	{
		id: 'asvedon',
		field: 'playerAsvedonCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.asvedon-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.asvedon-tooltip'),
	},
	{
		id: 'murozond',
		field: 'playerMurozondTheInfiniteCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.murozond-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.murozond-tooltip'),
	},
	{
		id: 'nagaGiant',
		field: 'playerNagaGiantCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.naga-giant-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.naga-giant-tooltip'),
	},
	{
		id: 'gardensGrace',
		field: 'playerGardensGraceCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.gardens-grace-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.gardens-grace-tooltip'),
	},
	{
		id: 'anachronos',
		field: 'playerAnachronosCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.anachronos-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.anachronos-tooltip'),
	},
	{
		id: 'shockspitter',
		field: 'playerShockspitterCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.shockspitter-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.shockspitter-tooltip'),
	},
	{
		id: 'bonelord-frostwhisper',
		field: 'playerBonelordFrostwhisperCounter',
		label: context.i18n.translateString('settings.decktracker.your-deck.counters.bonelord-frostwhisper-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.bonelord-frostwhisper-tooltip'),
	},
	...getAllCounters(context.i18n, context.allCards)
		.filter((counter) => counter.type === 'hearthstone')
		.filter((counter) => counter.player?.pref)
		.map((counter) => {
			const result: CounterSetting = {
				id: counter.id,
				field: counter.player!.pref,
				label: counter.player!.setting.label(context.i18n),
				tooltip: counter.player!.setting.tooltip(context.i18n, context.allCards),
				keywords: counter.cards?.map((cardId) => context.allCards.getCard(cardId)?.name) ?? null,
			};
			return result;
		}),
];
