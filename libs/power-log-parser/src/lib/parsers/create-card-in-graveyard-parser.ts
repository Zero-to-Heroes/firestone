import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { FullEntity, Node, NodeType } from '../models';
import { Oracle } from '../oracle';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CreateCardInGraveyardParser implements ActionParser {
	readonly ParserName = 'CreateCardInGraveyardParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const isValidElement = !this.StateFacade.Spectating || this.StateFacade.LocalPlayer?.Name != null;
		const appliesToFullEntity =
			isValidElement &&
			node.Type === NodeType.FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.GRAVEYARD as number) &&
			(node.Object as FullEntity).GetTag(GameTag.CARDTYPE) !== (CardType.ENCHANTMENT as number);
		return stateType === StateType.PowerTaskList && appliesToFullEntity;
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Type === NodeType.FullEntity) {
			return this.CreateEventFromFullEntity(node);
		}
		return null;
	}

	private CreateEventFromFullEntity(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const controllerId = fullEntity.GetEffectiveController();

		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'CREATE_CARD_IN_GRAVEYARD',
				() => {
					const creator = Oracle.FindCardCreator(this.GameState, fullEntity, node);
				let creatorCardId: string | null = creator?.[0] ?? null;
				let cardId = Oracle.PredictCardId(
					this.GameState,
					creatorCardId ?? '',
					creator?.[1] ?? -1,
					node,
					fullEntity.CardId,
				);
					if (cardId == null && this.GameState.CurrentTurn === 1 && fullEntity.GetTag(GameTag.ZONE_POSITION) === 5) {
						const controller = this.GameState.GetController(fullEntity.GetEffectiveController());
						if (controller && controller.GetTag(GameTag.CURRENT_PLAYER) !== 1) {
							cardId = 'GAME_005';
							creatorCardId = 'GAME_005';
						}
					}

					let shouldRemoveFromInitialDeck = false;
					let lastAffectedByEntity: FullEntity | null = null;
					if (
						fullEntity.GetTag(GameTag.LAST_AFFECTED_BY) > 0 &&
						this.StateFacade.GsState?.GameState.CurrentEntities.has(fullEntity.GetTag(GameTag.LAST_AFFECTED_BY))
					) {
						lastAffectedByEntity =
							this.StateFacade.GsState.GameState.CurrentEntities.get(fullEntity.GetTag(GameTag.LAST_AFFECTED_BY)) ??
							null;
						shouldRemoveFromInitialDeck = true;
					}

					return {
						Type: 'CREATE_CARD_IN_GRAVEYARD',
						Value: {
							CardId: cardId,
							ControllerId: controllerId,
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
							EntityId: fullEntity.Id,
							AdditionalProps: {
								CreatorCardId: creatorCardId,
								ShouldRemoveFromInitialDeck: shouldRemoveFromInitialDeck,
								IsPremium: fullEntity.GetTag(GameTag.PREMIUM) === 1,
								LastAffectedByEntityId: lastAffectedByEntity?.Id,
							},
						},
					};
				},
				true,
				node,
			),
		];
	}
}
