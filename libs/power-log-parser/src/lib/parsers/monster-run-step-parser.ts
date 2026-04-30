import { GameTag, ScenarioId } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Action, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';
import {
	actionHasDungeonHealthPassiveOnHero,
	lastHeroHealthTagChangeInAction,
} from './pve-run-step-health-passive';

const STARTING_HEALTH = 10;

export class MonsterRunStepParser implements ActionParser {
	readonly ParserName = 'MonsterRunStepParser';

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
		if (stateType !== StateType.PowerTaskList || node.Type !== NodeType.Action) {
			return false;
		}
		const action = node.Object as Action;
		const heroEntityId = this.resolveLocalHeroEntityId();
		if (heroEntityId == null) {
			return false;
		}
		return actionHasDungeonHealthPassiveOnHero(action, heroEntityId);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		return [
			GameEventProvider.Create(
				(node.Object as Action).TimeStamp,
				'MONSTER_HUNT_STEP',
				() => {
					if (this.StateFacade.ScenarioID !== (ScenarioId.GILA_DUNGEON as number)) {
						return null;
					}
					const action = node.Object as Action;
					const heroEntityId = this.resolveLocalHeroEntityId();
					if (heroEntityId == null) {
						return null;
					}
					if (!actionHasDungeonHealthPassiveOnHero(action, heroEntityId)) {
						return null;
					}
					const tagChange = lastHeroHealthTagChangeInAction(action, heroEntityId);
					const healthChangeDef =
						(tagChange != null
							? tagChange.Value
							: this.ParserState.GetEntity(heroEntityId)!.GetTag(GameTag.HEALTH)) - STARTING_HEALTH;
					const runStep = 1 + Math.floor(healthChangeDef / 5);
					return {
						Type: 'MONSTER_HUNT_STEP',
						Value: runStep,
					};
				},
				true,
				node,
			),
		];
	}

	private resolveLocalHeroEntityId(): number | null {
		const localPlayerId = this.StateFacade.LocalPlayer?.Id;
		if (localPlayerId == null) {
			return null;
		}
		const playerEntity = this.ParserState.GetEntity(localPlayerId);
		if (playerEntity == null) {
			return null;
		}
		const heroEntityId = playerEntity.GetTag(GameTag.HERO_ENTITY);
		return heroEntityId > 0 ? heroEntityId : null;
	}
}
