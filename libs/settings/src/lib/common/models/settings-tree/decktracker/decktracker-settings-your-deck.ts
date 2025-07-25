/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getAllCounters } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';
import { Mutable } from '@firestone/shared/framework/common';
import { debounceTime, map, Observable } from 'rxjs';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs, toSetting } from '../common';
import { CounterSetting } from './internal/decktracker-settings-internal';

export const decktrackerYourDeckSettings = (context: SettingContext): SettingNode => {
	const isAtLeastOneCounterDisabled$: Observable<boolean> = context.prefs.preferences$$.pipe(
		debounceTime(500),
		map((prefs) => counters(context).some((c) => !prefs[c.field])),
	);
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
				settings: [
					{
						text: isAtLeastOneCounterDisabled$.pipe(
							map((isDisabled) => (isDisabled ? context.i18n.translateString('settings.decktracker.your-deck.counters.enable-all') : context.i18n.translateString('settings.decktracker.your-deck.counters.disable-all'))),
						),
						tooltip: null,
						action: async () => {
							const isAtLeastOneCounterDisabled = counters(context).some((c) => !context.prefs.preferences$$.value[c.field]);
							isAtLeastOneCounterDisabled ? enableAllCounters(context) : disableAllCounters(context);
						},
					},
					...counters(context).map((counter) => toSetting(counter)),
				],
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
						type: 'toggle',
						field: 'maxResourcesWidgetShowHorizontally',
						label: context.i18n.translateString('settings.decktracker.max-resources-widget.show-horizontally'),
						tooltip: context.i18n.translateString('settings.decktracker.max-resources-widget.show-horizontally-tooltip'),
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

const enableAllCounters = (context: SettingContext) => {
	const allCounters = counters(context);
	const newPrefs: Mutable<Preferences> = { ...context.prefs.preferences$$.value };
	allCounters.forEach((c) => {
		(newPrefs as any)[c.field as keyof Preferences] = true;
	});
	context.prefs.savePreferences(newPrefs);
};
const disableAllCounters = (context: SettingContext) => {
	const allCounters = counters(context);
	const newPrefs: Mutable<Preferences> = { ...context.prefs.preferences$$.value };
	allCounters.forEach((c) => {
		(newPrefs as any)[c.field as keyof Preferences] = false;
	});
	context.prefs.savePreferences(newPrefs);
};

const counters = (context: SettingContext): readonly CounterSetting[] => rawCounters(context).sort((a, b) => a.label.localeCompare(b.label));
const rawCounters = (context: SettingContext): CounterSetting[] => [
	{
		id: 'attack-on-board',
		field: 'playerAttackCounter',
		label: context.i18n.translateString('settings.decktracker.opponent-deck.counters.attack-on-board-label'),
		tooltip: context.i18n.translateString('settings.decktracker.your-deck.counters.attack-on-board-tooltip'),
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
