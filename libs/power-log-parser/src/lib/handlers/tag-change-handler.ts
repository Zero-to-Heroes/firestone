import { GameTag, PlayState } from '@firestone-hs/reference-data';
import type { Helper } from '../helper';
import { innkeeperNames, bobTavernNames } from '../helper';
import { GameEventProvider } from '../game-event';
import { Logger } from '../logger';
import { Action, FullEntity, Game, Node, NodeType, PlayerEntity, Tag, TagChange } from '../models';
import { Regexes } from '../regexes';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class TagChangeHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		stateType: StateType,
		gameHelper: StateFacade,
		indentLevel: number,
		helper: Helper,
	): boolean {
		if (!data.includes('TAG_CHANGE')) {
			return false;
		}
		const match = Regexes.ActionTagChangeRegex.exec(data);
		if (match) {
			const rawEntity = match[1];
			const tagName = match[2];
			const value = match[3];
			const defChange = match[4] ?? null;
			let tag: Tag | null = null;
			try {
				tag = helper.ParseTag(tagName, value);
			} catch (e: any) {
				Logger.Log('Warning when parsing TagChange: ' + tagName + ' with value ' + value, e.message);
				return false;
			}
			state.GameState.UpdateEntityName(rawEntity);

			if (tag.Name === (GameTag.CURRENT_PLAYER as number)) {
				if (state.FirstPlayerEntityId === -1) {
					let entityId = parseInt(rawEntity, 10);
					if (isNaN(entityId) || entityId <= 0) {
						entityId = helper.GetPlayerIdFromName(rawEntity);
					}
					state.FirstPlayerEntityId = entityId;
				}
				TagChangeHandler.UpdateCurrentPlayer(state, rawEntity, tag, helper);
			}

			if (
				stateType === StateType.PowerTaskList &&
				tag.Name === (GameTag.PLAYSTATE as number) &&
				tag.Value === (PlayState.PLAYING as number)
			) {
				if (state.ReconnectionOngoing) {
					state.ReconnectionOngoing = false;
					gameHelper.GsState!.ReconnectionOngoing = false;
					state.NodeParser.EnqueueGameEvent([
						GameEventProvider.Create(
							timestamp,
							'RECONNECT_OVER',
							() => ({
								Type: 'RECONNECT_OVER',
							}),
							false,
							new Node(NodeType.Placeholder, null, 0, null, data),
						),
					]);
				}
			}

			let entity = helper.ParseEntity(rawEntity);
			if (tag.Name === (GameTag.ENTITY_ID as number)) {
				entity = TagChangeHandler.UpdatePlayerEntity(state, rawEntity, tag, entity);
			}

			if (
				state.Node?.Type === NodeType.FullEntity &&
				(state.Node.Object as FullEntity).Id === entity
			) {
				state.Node = state.Node.Parent ?? state.Node;
			}

			const tagChange = new TagChange();
			tagChange.Entity = entity;
			tagChange.Name = tag.Name;
			tagChange.Value = tag.Value;
			tagChange.TimeStamp = timestamp;
			tagChange.DefChange = defChange ?? '';
			tagChange.SubSpellInEffect = state.CurrentSubSpell?.GetActiveSubSpell() ?? null;

			state.UpdateCurrentNode(NodeType.Game, NodeType.Action);
			state.CreateNewNode(new Node(NodeType.TagChange, tagChange, indentLevel, state.Node, data));

			if (state.Node!.Type === NodeType.Game) {
				(state.Node!.Object as Game).AddData(tagChange);
			} else if (state.Node!.Type === NodeType.Action) {
				(state.Node!.Object as Action).Data.push(tagChange);
			} else {
				throw new Error('Invalid node ' + state.Node!.Type);
			}

			state.GameState.TagChange(tagChange, defChange ?? '');

			if (
				tagChange.Name === (GameTag.NUM_OPTIONS_PLAYED_THIS_TURN as number) &&
				tagChange.Value > 0
			) {
				if (state.Node!.Type !== NodeType.Game) {
					state.EndAction();
				}
				state.UpdateCurrentNode(NodeType.Game);
			}
			return true;
		}
		return false;
	}

	private static UpdateCurrentPlayer(
		state: ParserState,
		rawEntity: string,
		tag: Tag,
		helper: Helper,
	): void {
		if (tag.Value === 0) {
			try {
				helper.ParseEntity(rawEntity);
			} catch {
				const currentPlayer = state.CurrentGame.Data.find(
					(x) => x instanceof PlayerEntity && x.Id === state.CurrentPlayerId,
				) as PlayerEntity;
				if (currentPlayer) {
					currentPlayer.Name = rawEntity;
					currentPlayer.InitialName = innkeeperNames.includes(rawEntity)
						? innkeeperNames[0]
						: bobTavernNames.includes(rawEntity)
							? bobTavernNames[0]
							: rawEntity;
				}
			}
		} else if (tag.Value === 1) {
			try {
				helper.ParseEntity(rawEntity);
			} catch {
				const currentPlayer = state.CurrentGame.Data.find(
					(x) => x instanceof PlayerEntity && x.Id !== state.CurrentPlayerId,
				) as PlayerEntity;
				if (currentPlayer) {
					currentPlayer.Name = rawEntity;
					currentPlayer.InitialName = innkeeperNames.includes(rawEntity)
						? innkeeperNames[0]
						: bobTavernNames.includes(rawEntity)
							? bobTavernNames[0]
							: rawEntity;
				}
			}
			state.CurrentPlayerId = helper.ParseEntity(rawEntity);
		}
	}

	private static UpdatePlayerEntity(
		state: ParserState,
		rawEntity: string,
		tag: Tag,
		entity: number,
	): number {
		const tmp = parseInt(rawEntity, 10);
		if (isNaN(tmp) && !rawEntity.startsWith('[') && rawEntity !== 'GameEntity') {
			if (entity !== tag.Value) {
				entity = tag.Value;
				const tmpName = (state.CurrentGame.Data[1] as PlayerEntity).Name;
				(state.CurrentGame.Data[1] as PlayerEntity).Name = (
					state.CurrentGame.Data[2] as PlayerEntity
				).Name;
				(state.CurrentGame.Data[2] as PlayerEntity).Name = tmpName;

				for (const dataObj of (state.Node!.Object as Game).Data) {
					const tChange = dataObj instanceof TagChange ? dataObj : null;
					if (tChange != null) {
						tChange.Entity = tChange.Entity === 2 ? 3 : 2;
					}
				}
			}
		}
		return entity;
	}
}
