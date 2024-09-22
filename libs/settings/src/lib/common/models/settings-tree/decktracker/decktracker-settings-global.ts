import { SettingContext, SettingNode } from '../../settings.types';

export const decktrackerGlobalSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-global',
		name: context.i18n.translateString('settings.decktracker.menu.global'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'decktracker-global',
				title: context.i18n.translateString('settings.decktracker.global.title'),
				settings: [
					{
						type: 'toggle',
						field: 'useStreamerMode',
						label: context.i18n.translateString('settings.decktracker.global.streamer-mode'),
						tooltip: context.i18n.translateString('settings.decktracker.global.streamer-mode-tooltip'),
					},
				],
			},
			{
				id: 'decktracker-global-features',
				title: null,
				settings: [
					{
						type: 'toggle',
						field: 'overlayShowTitleBar',
						label: context.i18n.translateString('settings.decktracker.global.show-title-bar'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-title-bar-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowControlBar',
						label: context.i18n.translateString('settings.decktracker.global.show-control-bar'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-control-bar-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowTooltipsOnHover',
						label: context.i18n.translateString('settings.decktracker.global.show-tooltips-on-hover'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'overlayShowRelatedCards',
						label: context.i18n.translateString('settings.collection.general.show-related-cards-label'),
						tooltip: context.i18n.translateString('settings.collection.general.show-related-cards-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowTransformedInto',
						label: context.i18n.translateString('settings.decktracker.global.show-transformed-into-label'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-transformed-into-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowRarityColors',
						label: context.i18n.translateString('settings.decktracker.global.show-rarity-color'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-rarity-color-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowDeckWinrate',
						label: context.i18n.translateString('settings.decktracker.global.show-deck-winrate'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-deck-winrate-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowMatchupWinrate',
						label: context.i18n.translateString('settings.decktracker.global.show-matchup-winrate'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-matchup-winrate-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowBoardCardsSeparateZone',
						label: context.i18n.translateString('settings.decktracker.global.show-board-in-separate-zone'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-board-in-separate-zone-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowGiftedCardsInSeparateLine',
						label: context.i18n.translateString('settings.decktracker.global.show-gifts-separately'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-gifts-separately-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowGiftedCardsSeparateZone',
						label: context.i18n.translateString('settings.decktracker.global.show-gifts-in-separate-zone'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-gifts-in-separate-zone-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayGroupSameCardsTogether',
						label: context.i18n.translateString('settings.decktracker.global.group-same-cards'),
						tooltip: context.i18n.translateString('settings.decktracker.global.group-same-cards-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowPlaguesOnTop',
						label: context.i18n.translateString('settings.decktracker.global.show-plagues-on-top'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-plagues-on-top-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayResetDeckPositionAfterTrade2',
						label: context.i18n.translateString('settings.decktracker.global.reset-deck-position-after-trade'),
						tooltip: context.i18n.translateString('settings.decktracker.global.reset-deck-position-after-trade-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowStatsChange',
						label: context.i18n.translateString('settings.decktracker.global.show-stats-change'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-stats-change-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowCostReduction',
						label: context.i18n.translateString('settings.decktracker.global.show-cost-reduction'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-cost-reduction-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayShowUnknownCards',
						label: context.i18n.translateString('settings.decktracker.global.show-unknown-cards'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-unknown-cards-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayHighlightRelatedCards',
						label: context.i18n.translateString('settings.decktracker.global.highlight-related-cards'),
						tooltip: context.i18n.translateString('settings.decktracker.global.highlight-related-cards-tooltip'),
					},
					{
						type: 'toggle',
						field: 'overlayEnableDiscoverHelp',
						label: context.i18n.translateString('settings.decktracker.global.discover-help'),
						tooltip: context.i18n.translateString('settings.decktracker.global.discover-help-tooltip'),
					},
					{
						type: 'toggle',
						field: 'decktrackerCloseOnGameEnd',
						label: context.i18n.translateString('settings.decktracker.global.close-tracker-on-end'),
						tooltip: context.i18n.translateString('settings.decktracker.global.close-tracker-on-end-tooltip'),
						advancedSetting: true,
						toggleConfig: {
							messageWhenToggleValue: context.i18n.translateString('settings.decktracker.global.close-tracker-on-end-advanced'),
							valueToDisplayMessageOn: false,
						},
					},
					{
						type: 'toggle',
						field: 'decktrackerShowMinionPlayOrderOnBoard',
						label: context.i18n.translateString('settings.decktracker.global.minions-play-order'),
						tooltip: context.i18n.translateString('settings.decktracker.global.minions-play-order-tooltip'),
					},
				],
			},
			{
				id: 'decktracker-global-counters',
				title: null,
				settings: [
					{
						type: 'toggle',
						field: 'countersUseExpandedView',
						label: context.i18n.translateString('settings.decktracker.global.counters-use-expanded-view-label'),
						tooltip: context.i18n.translateString('settings.decktracker.global.counters-use-expanded-view-tooltip'),
					},
				],
			},
		],
	};
};
