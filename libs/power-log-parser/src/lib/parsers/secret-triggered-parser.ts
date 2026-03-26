import { BlockType, CardType, GameTag } from '@firestone-hs/reference-data';
import { ParserGameTag } from '../enums';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class SecretTriggeredParser implements ActionParser {
	readonly ParserName = 'SecretTriggeredParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === Action &&
			(node.Object as Action).Type === (BlockType.TRIGGER as number) &&
			(node.Object as Action).TriggerKeyword === (GameTag.SECRET as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const entity = this.GameState.CurrentEntities.get(action.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (
			this.GameState.CurrentEntities.get(action.Entity)!.GetTag(GameTag.CARDTYPE) ===
			(CardType.ENCHANTMENT as number)
		) {
			return null;
		}

		const parentAction = node.Parent?.Object as Action | null;
		let additionalProps: any = {};
		if (parentAction != null && parentAction.Type === (BlockType.ATTACK as number)) {
			const attackerTag = parentAction.Data.filter((d): d is TagChange => d instanceof TagChange).find(
				(t) => t.Name === (GameTag.PROPOSED_ATTACKER as number),
			);
			const defenderTag = parentAction.Data.filter((d): d is TagChange => d instanceof TagChange).find(
				(t) => t.Name === (GameTag.PROPOSED_DEFENDER as number),
			);
			if (attackerTag && defenderTag) {
				const proposedAttacker = this.GameState.CurrentEntities.get(attackerTag.Value)!;
				const proposedDefender = this.GameState.CurrentEntities.get(defenderTag.Value)!;
				additionalProps = {
					ProposedAttackerCardId: proposedAttacker.CardId,
					ProposedAttackerEntityId: attackerTag.Value,
					ProposedAttackerControllerId: proposedAttacker.GetEffectiveController(),
					ProposedDefenderCardId: proposedDefender.CardId,
					ProposedDefenderEntityId: defenderTag.Value,
					ProposedDefenderControllerId: proposedDefender.GetEffectiveController(),
				};
			}
		} else if (parentAction != null && parentAction.Type === (BlockType.PLAY as number)) {
			additionalProps = {
				InReactionToCardId: this.GameState.CurrentEntities.get(parentAction.Entity)?.CardId,
				InReactionToEntityId: parentAction.Entity,
			};
		}

		entity.SetTag(ParserGameTag.SECRET_HAS_TRIGGERED, 1);
		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'SECRET_TRIGGERED',
				GameEventHelper.CreateProvider(
					'SECRET_TRIGGERED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					additionalProps,
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
