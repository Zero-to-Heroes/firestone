import { Injectable } from '@angular/core';
import { RawAchievement } from '../../../../models/achievement/raw-achievement';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { ArmorAtEndReq } from '../requirements/armor-at-end-req';
import { CardDrawnOrReceivedInHandReq } from '../requirements/card-drawn-or-received-in-hand-req';
import { CardPlayedOrChangedOnBoardReq } from '../requirements/card-played-or-changed-on-board-req';
import { CardPlayedOrOnBoardAtGameStartReq } from '../requirements/card-played-or-on-board-at-game-start-req';
import { CorrectOpponentReq } from '../requirements/correct-opponent-req';
import { DungeonRunStepReq } from '../requirements/dungeon-run-step-req';
import { FormatTypeReq } from '../requirements/format-type-req';
import { GameTypeReq } from '../requirements/game-type-req';
import { GameWonReq } from '../requirements/game-won-req';
import { HealthAtEndReq } from '../requirements/health-at-end-req';
import { MonsterHuntStepReq } from '../requirements/monster-hunt-step-req';
import { MulliganDoneReq } from '../requirements/mulligan-done-req';
import { PassiveBuffReq } from '../requirements/passive-buff-req';
import { PlayerHeroReq } from '../requirements/player-hero-req';
import { RumbleRunStepReq } from '../requirements/rumble-run-step-req';
import { ScenarioIdReq } from '../requirements/scenario-id-req';
import { SceneChangedToGameReq } from '../requirements/scene-changed-to-game-req';
import { StandardRankedMinRankReq } from '../requirements/standard-ranked-min-rank-req';
import { Requirement } from '../requirements/_requirement';
import { Challenge } from './challenge';
import { GenericChallenge } from './generic-challenge';

@Injectable()
export class ChallengeBuilderService {
	constructor() {}

	public buildChallenge(raw: RawAchievement): Challenge {
		const requirements: readonly Requirement[] = this.buildRequirements(raw.requirements);
		return new GenericChallenge(raw.id, raw.resetEvents, requirements);
	}

	private buildRequirements(rawReqs: readonly RawRequirement[]): readonly Requirement[] {
		return rawReqs.map(rawReq => this.buildRequirement(rawReq));
	}

	private buildRequirement(rawReq: RawRequirement): Requirement {
		// prettier-ignore
		switch (rawReq.type) {
			case 'DUNGEON_RUN_STEP': return DungeonRunStepReq.create(rawReq);
			case 'MONSTER_HUNT_STEP': return MonsterHuntStepReq.create(rawReq);
			case 'RUMBLE_RUN_STEP': return RumbleRunStepReq.create(rawReq);
			case 'GAME_TYPE': return GameTypeReq.create(rawReq);
			case 'RANKED_MIN_RANK': return StandardRankedMinRankReq.create(rawReq);
			case 'RANKED_FORMAT_TYPE': return FormatTypeReq.create(rawReq);
			case 'SCENARIO_IDS': return ScenarioIdReq.create(rawReq);
			case 'MULLIGAN_DONE': return MulliganDoneReq.create(rawReq);
			case 'GAME_WON': return GameWonReq.create(rawReq);
			case 'PLAYER_HERO': return PlayerHeroReq.create(rawReq);
			case 'CORRECT_OPPONENT': return CorrectOpponentReq.create(rawReq);
			case 'SCENE_CHANGED_TO_GAME': return SceneChangedToGameReq.create(rawReq);
			case 'CARD_PLAYED_OR_CHANGED_ON_BOARD': return CardPlayedOrChangedOnBoardReq.create(rawReq);
			case 'CARD_PLAYED_OR_ON_BOARD_AT_GAME_START': return CardPlayedOrOnBoardAtGameStartReq.create(rawReq);
			case 'CARD_DRAWN_OR_RECEIVED_IN_HAND': return CardDrawnOrReceivedInHandReq.create(rawReq);
			case 'PASSIVE_BUFF': return PassiveBuffReq.create(rawReq);
			case 'HEALTH_AT_END': return HealthAtEndReq.create(rawReq);
			case 'ARMOR_AT_END': return ArmorAtEndReq.create(rawReq);
			default: 
				console.error('No requirement provider found, providing no-op requirement instead', rawReq.type, rawReq);
				return {
					test: () => true,
					afterAchievementCompletionReset: () => true,
					isCompleted: () => true,
					reset: () => true,
				};
		}
	}
}
