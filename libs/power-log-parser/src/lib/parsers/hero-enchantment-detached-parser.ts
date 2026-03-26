import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class HeroEnchantmentDetachedParser implements ActionParser {
	readonly ParserName = 'HeroEnchantmentDetachedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.PowerTaskList || node.Type !== TagChange) {
			return false;
		}
		const tagChange = node.Object as TagChange;
		return (
			tagChange.Name === (GameTag.ZONE as number) &&
			tagChange.Value === (Zone.GRAVEYARD as number) &&
			this.GameState.CurrentEntities.get(tagChange.Entity)?.GetCardType() === (CardType.ENCHANTMENT as number) &&
			this.GameState.CurrentEntities.get(tagChange.Entity)!.GetZone() === (Zone.PLAY as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'ENCHANTMENT_DETACHED',
				GameEventHelper.CreateProvider(
					'ENCHANTMENT_DETACHED',
					cardId,
					controllerId,
					entity.Entity,
					this.StateFacade,
					{
						AttachedTo: entity.GetTag(GameTag.ATTACHED),
					},
				),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
