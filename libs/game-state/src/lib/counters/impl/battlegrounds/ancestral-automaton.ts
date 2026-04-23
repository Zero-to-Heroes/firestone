/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { FullEntity } from '@firestone/power-log-parser';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { getControllerEntity, getPlayerEnchantments } from '../../../services/parser-entity-utils';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class BgsAncestralAutomatonCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'bgsAncestralAutomaton';
	public override image = CardIds.AstralAutomaton_BG_TTN_401;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsAncestralAutomatonCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			const controllerEntity = getControllerEntity(
				state.parserState?.CurrentEntities,
				state.parserState?.ControllerEntityMap,
				state.localPlayerId!,
			);
			const enchants = getPlayerEnchantments(
				state.parserState?.CurrentEntities,
				controllerEntity as FullEntity,
				CardIds.AstralAutomatonPlayerEnchantDntEnchantment_BG_TTN_401pe,
			);
			const value = enchants
				.map((e) => e.Tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 0)
				.reduce((a, b) => a + b, 0);
			if (value === 0) {
				return null;
			}
			return value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.ancestral-automaton-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ancestral-automaton-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
	): string {
		const value = this.player.value(gameState, bgState)!;
		return this.i18n.translateString(`counters.ancestral-automaton.${side}`, {
			value: value,
		});
	}
}
