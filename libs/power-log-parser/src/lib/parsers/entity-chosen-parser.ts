import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Choice, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class EntityChosenParser implements ActionParser {
	readonly ParserName = 'EntityChosenParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, _stateType: StateType): boolean {
		return node.Type === NodeType.Choice && this.ParserState.CurrentChosenEntites != null;
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const choice = node.Object as Choice;
		const ptlState = this.StateFacade.PtlState?.GameState;
		const keyInGS = this.GameState.CurrentEntities.has(choice.Entity);
		const chosenEntity =
			ptlState?.CurrentEntities?.has(choice.Entity)
				? ptlState.CurrentEntities.get(choice.Entity)!
				: keyInGS
					? this.GameState.CurrentEntities.get(choice.Entity)!
					: null;
		if (chosenEntity == null) {
			return null;
		}

		const isCopy = ptlState?.CurrentEntities?.has(chosenEntity.GetTag(GameTag.LINKED_ENTITY)) ?? false;
		const originalEntity = isCopy
			? ptlState!.CurrentEntities.get(chosenEntity.GetTag(GameTag.LINKED_ENTITY))!
			: null;
		const controllerId = chosenEntity.GetEffectiveController();

		return [
			GameEventProvider.Create(
				choice.TimeStamp,
				'ENTITY_CHOSEN',
				() => {
					const gsChosenEntity = this.GameState.CurrentEntities.get(choice.Entity);
					let creatorEntityId = gsChosenEntity?.GetTag(GameTag.CREATOR) ?? -1;
					if (creatorEntityId === -1) {
						creatorEntityId = gsChosenEntity?.GetTag(GameTag.DISPLAYED_CREATOR) ?? -1;
					}
					const creatorEntity = ptlState?.CurrentEntities?.has(creatorEntityId)
						? ptlState!.CurrentEntities.get(creatorEntityId)!
						: null;
					const creatorCardId = creatorEntity?.CardId;

					if (
						creatorCardId === CardIds.SuspiciousPirate ||
						creatorCardId === CardIds.SuspiciousAlchemist ||
						creatorCardId === CardIds.SuspiciousUsher ||
						creatorCardId === CardIds.SuspiciousPeddler
					) {
						creatorEntity!.KnownEntityIds.push(chosenEntity.Id);
					}

					return {
						Type: 'ENTITY_CHOSEN',
						Value: {
							CardId: chosenEntity.CardId,
							ControllerId: controllerId,
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
							EntityId: chosenEntity.Id,
							AdditionalProps: {
								OriginalEntityId: originalEntity?.Id,
								Context: {
									CreatorEntityId: creatorEntityId,
									CreatorCardId: creatorCardId,
								},
							},
						},
					};
				},
				true,
				node,
				null,
				400,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
