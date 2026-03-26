import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsPlayerTechLevelUpdatedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsPlayerTechLevelUpdatedParser';

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
			this.StateFacade.IsBattlegrounds() &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.PLAYER_TECH_LEVEL as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const hero = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (hero == null) {
			return null;
		}

		const heroCardId = hero.CardId;
		const heroes = [...this.GameState.CurrentEntities.values()]
			.filter((entity) => entity.CardId === heroCardId)
			.filter((entity) => entity.GetTag(GameTag.PLAYER_TECH_LEVEL) >= tagChange.Value);
		if (heroes.length > 0) {
			return null;
		}

		if (
			hero?.CardId != null &&
			hero.CardId.length > 0 &&
			!hero.IsBaconBartender() &&
			!hero.IsBaconEnchantment() &&
			!hero.IsBaconGhost() &&
			tagChange.Value > 1
		) {
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'BATTLEGROUNDS_TAVERN_UPGRADE',
					() => ({
						Type: 'BATTLEGROUNDS_TAVERN_UPGRADE',
						Value: {
							CardId: hero.CardId,
							PlayerId: hero.GetTag(GameTag.PLAYER_ID),
							TavernLevel: tagChange.Value,
						},
					}),
					false,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
