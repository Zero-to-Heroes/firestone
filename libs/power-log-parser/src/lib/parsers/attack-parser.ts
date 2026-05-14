import { CardType, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class AttackParser implements ActionParser {
	readonly ParserName = 'AttackParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.DEFENDING as number) &&
			(node.Object as TagChange).Value === 1
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		if ((node.Parent?.Object as Action | null) == null) {
			return null;
		}

		const tagChange = node.Object as TagChange;
		const parentAction = node.Parent!.Object as Action;
		const attackerTag = parentAction.Data.filter((d): d is TagChange => d instanceof TagChange).find(
			(tag) => tag.Name === (GameTag.ATTACKING as number) && tag.Value === 1,
		);
		if (!attackerTag) {
			return null;
		}
		const attackerId = attackerTag.Entity;
		const defenderId = tagChange.Entity;

		if (!this.GameState.CurrentEntities.has(attackerId) || !this.GameState.CurrentEntities.has(defenderId)) {
			console.debug(
				'Could not find entity or target',
				attackerId + ' // ' + defenderId + ' // ' + node.CreationLogLine,
			);
		}

		const attacker = this.GameState.CurrentEntities.get(attackerId)!;
		const defender = this.GameState.CurrentEntities.get(defenderId)!;
		const defenderTags = defender.GetTagsCopy();
		const attackerTags = attacker.GetTagsCopy();

		let eventType = 'ATTACKING_UNKNOWN';
		if (defender.GetTag(GameTag.CARDTYPE) === (CardType.MINION as number)) {
			eventType = 'ATTACKING_MINION';
		} else if (defender.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number)) {
			eventType = 'ATTACKING_HERO';
		}

		const attackerCardId = attacker.CardId;
		const defenderCardId = defender.CardId;
		const attackerControllerId = attacker.GetEffectiveController();
		const defenderControllerId = defender.GetEffectiveController();

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				eventType,
				GameEventHelper.CreateProvider(eventType, null as any, -1, -1, this.StateFacade, {
					AttackerCardId: attackerCardId,
					AttackerEntityId: attacker.Id,
					AttackerControllerId: attackerControllerId,
					AttackerTags: attackerTags,
					DefenderCardId: defenderCardId,
					DefenderEntityId: defender.Id,
					DefenderControllerId: defenderControllerId,
					DefenderTags: defenderTags,
				}),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
