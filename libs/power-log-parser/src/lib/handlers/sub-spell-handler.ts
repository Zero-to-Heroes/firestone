import type { Helper } from '../helper';
import { GameEventProvider } from '../game-event';
import { Action, Node, NodeType, SubSpell } from '../models';
import { Regexes } from '../regexes';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class SubSpellHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		stateType: StateType,
		stateFacade: StateFacade,
		helper: Helper,
	): boolean {
		let match = Regexes.SubSpellStartRegex.exec(data);
		if (match) {
			const subSpellPrefab = match[1];
			let sourceEntityId = parseInt(match[2], 10);
			let parentActionNode = state.Node;
			while (parentActionNode != null && parentActionNode.Type !== NodeType.Action) {
				parentActionNode = parentActionNode.Parent;
			}

			let parentAction: Action | null = null;
			if (parentActionNode != null) {
				parentAction = parentActionNode.Object as Action;
			}
			if (sourceEntityId === 0) {
				sourceEntityId = parentAction?.Entity ?? -1;
			}
			const sourceEntity = state.GameState.CurrentEntities.get(sourceEntityId) ?? null;
			const spell = new SubSpell();
			spell.Prefab = subSpellPrefab;
			spell.Timestamp = timestamp;
			if (sourceEntityId > 0) {
				spell.Source = sourceEntityId;
			}

			SubSpellHandler.SetActiveSubSpell(state, spell);
			if (parentAction != null) {
				parentAction.SubSpells.push(spell);
			}

			state.NodeParser.NewNode(
				new Node(NodeType.SubSpell, state.CurrentSubSpell?.GetActiveSubSpell() ?? null, 0, state.Node, data),
				stateType,
			);
			if (stateType === StateType.PowerTaskList && !state.IsBattlegrounds()) {
				state.NodeParser.EnqueueGameEvent([
					GameEventProvider.Create(
						timestamp,
						'SUB_SPELL_START',
						() => ({
							Type: 'SUB_SPELL_START',
							Value: {
								PrefabId: subSpellPrefab,
								EntityId: sourceEntityId,
								CardId: sourceEntity?.CardId ?? null,
								ParentEntityId: parentAction?.Entity ?? null,
								ParentCardId:
									parentAction?.Entity != null &&
									state.GameState.CurrentEntities.has(parentAction.Entity)
										? state.GameState.CurrentEntities.get(parentAction.Entity)!.CardId
										: null,
								LocalPlayer: stateFacade.LocalPlayer,
								OpponentPlayer: stateFacade.OpponentPlayer,
								ControllerId: sourceEntity?.GetController() ?? null,
							},
						}),
						false,
						new Node(NodeType.Placeholder, null, 0, null, data),
					),
				]);
			}
			return true;
		}

		match = Regexes.SubSpellSourceRegex.exec(data);
		if (match && state.CurrentSubSpell != null) {
			const rawEntity = match[1];
			const entity = helper.ParseEntity(rawEntity);
			state.CurrentSubSpell.GetActiveSubSpell().Source = entity;
			return true;
		}

		match = Regexes.SubSpellTargetsRegex.exec(data);
		if (match && state.CurrentSubSpell != null) {
			const rawEntity = match[1];
			const entity = helper.ParseEntity(rawEntity);
			if (state.CurrentSubSpell.GetActiveSubSpell().Targets == null) {
				state.CurrentSubSpell.GetActiveSubSpell().Targets = [];
			}
			state.CurrentSubSpell.GetActiveSubSpell().Targets.push(entity);
			return true;
		}

		if (data === 'SUB_SPELL_END') {
			state.NodeParser.CloseNode(
				new Node(NodeType.SubSpell, state.CurrentSubSpell?.GetActiveSubSpell() ?? null, 0, state.Node, data),
				stateType,
			);
			if (stateType === StateType.PowerTaskList && state.CurrentSubSpell != null && !state.IsBattlegrounds()) {
				const subSpell = state.CurrentSubSpell.GetActiveSubSpell();
				let parentAction: Action | null = null;
				if (state.Node?.Type === NodeType.Action) {
					parentAction = state.Node.Object as Action;
				}
				let sourceEntityId2 = subSpell.Source;
				if (sourceEntityId2 === 0) {
					sourceEntityId2 = parentAction?.Entity ?? -1;
				}
				const sourceEntity2 = state.GameState.CurrentEntities.get(sourceEntityId2) ?? null;
				state.NodeParser.EnqueueGameEvent([
					GameEventProvider.Create(
						timestamp,
						'SUB_SPELL_END',
						() => ({
							Type: 'SUB_SPELL_END',
							Value: {
								PrefabId: subSpell.Prefab,
								SourceEntityId: sourceEntityId2,
								SourceCardId: sourceEntity2?.CardId ?? null,
								TargetEntityIds: subSpell.Targets,
								LocalPlayer: stateFacade.LocalPlayer,
								OpponentPlayer: stateFacade.OpponentPlayer,
								ControllerId: sourceEntity2?.GetController() ?? null,
							},
						}),
						false,
						new Node(NodeType.Placeholder, null, 0, null, data),
					),
				]);
			}
			SubSpellHandler.SetActiveSubSpell(state, null);
			return true;
		}
		return false;
	}

	private static SetActiveSubSpell(state: ParserState, spell: SubSpell | null): void {
		if (spell != null) {
			if (state.CurrentSubSpell == null) {
				state.CurrentSubSpell = spell;
			} else {
				state.CurrentSubSpell.GetActiveSubSpell().Spell = spell;
			}
		} else {
			state.ClearActiveSubSpell();
		}
	}
}
