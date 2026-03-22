import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, FullEntity, Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const DECK_ID_SCENARIOS = [3428, 3429, 3430, 3431, 3432, 3438, 3433, 3434, 3435, 3436, 3437, 3439];

export class DecklistUpdateParser implements ActionParser {
	readonly ParserName = 'DecklistUpdateParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return stateType === StateType.PowerTaskList && this.isDecklistUpdateAction(node);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const cardsCreatedInDeck = action.Data.filter((data): data is FullEntity => data instanceof FullEntity).filter(
			(entity) => entity.GetTag(GameTag.ZONE) === (Zone.DECK as number),
		);
		if (cardsCreatedInDeck == null || cardsCreatedInDeck.length === 0) {
			return null;
		}

		const timestamp = cardsCreatedInDeck[cardsCreatedInDeck.length - 1].TimeStamp;
		const fullEntities = action.Data.filter((data): data is FullEntity => data instanceof FullEntity)
			.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
			.filter((entity) => {
				if (DECK_ID_SCENARIOS.includes(this.StateFacade.ScenarioID)) {
					return entity.GetTag(GameTag.HERO_DECK_ID) > 0;
				}
				return (
					entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number) &&
					entity.GetEffectiveController() === this.StateFacade.OpponentPlayer!.PlayerId
				);
			});

		return fullEntities.map((fullEntity) => {
			const deckId = DECK_ID_SCENARIOS.includes(this.StateFacade.ScenarioID)
				? '' + fullEntity.GetTag(GameTag.HERO_DECK_ID)
				: fullEntity.CardId;
			const controllerId = fullEntity.GetEffectiveController();
			return GameEventProvider.Create(
				timestamp,
				'DECKLIST_UPDATE',
				GameEventHelper.CreateProvider('DECKLIST_UPDATE', null as any, controllerId, -1, this.StateFacade, {
					DeckId: deckId,
				}),
				true,
				node,
			);
		});
	}

	private isDecklistUpdateAction(node: Node): boolean {
		if (node.Type !== Action) {
			return false;
		}
		const action = node.Object as Action;
		return (
			action.Data != null &&
			action.Data.filter((data): data is FullEntity => data instanceof FullEntity)
				.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
				.filter((entity) => {
					if (DECK_ID_SCENARIOS.includes(this.StateFacade.ScenarioID)) {
						return entity.GetTag(GameTag.HERO_DECK_ID) > 0;
					}
					return (
						entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number) &&
						entity.GetEffectiveController() === this.StateFacade.OpponentPlayer!.PlayerId
					);
				}).length > 0
		);
	}
}
