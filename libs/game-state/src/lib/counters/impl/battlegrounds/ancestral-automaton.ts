/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag, Zone } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { getControllerEntity, getEntityTag } from '../../../services/parser-entity-utils';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

const TARGET_ENCHANT_ID = CardIds.AstralAutomatonPlayerEnchantDntEnchantment_BG_TTN_401pe;

export class BgsAncestralAutomatonCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'bgsAncestralAutomaton';
	public override image = CardIds.AstralAutomaton_BG_TTN_401;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsAncestralAutomatonCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			// `display: () => true` means this counter's `value` runs on every counter
			// re-evaluation. Iterate `CurrentEntities` *once* and sum
			// `TAG_SCRIPT_DATA_NUM_1` for matching enchantments inline, instead of
			// materialising two intermediate arrays via `getPlayerEnchantments` (which
			// allocates `[...values()]` + filter + filter on every call). On a late-game
			// BG board with hundreds of entities and active Astral Automaton triggers,
			// this is the difference between a measurable per-frame allocation spike and
			// a single-pass scan.
			const entities = state.parserState?.CurrentEntities;
			if (!entities) return null;
			const controllerEntity = getControllerEntity(
				entities,
				state.parserState?.ControllerEntityMap,
				state.localPlayerId!,
			);
			if (!controllerEntity) return null;
			const controllerId = controllerEntity.Id;
			let value = 0;
			for (const e of entities.values()) {
				if (e.CardId !== TARGET_ENCHANT_ID) continue;
				if (getEntityTag(e, GameTag.ATTACHED) !== controllerId) continue;
				if (getEntityTag(e, GameTag.ZONE) !== (Zone.PLAY as number)) continue;
				const tag = e.Tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1);
				value += tag?.Value ?? 0;
			}
			return value === 0 ? null : value;
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
