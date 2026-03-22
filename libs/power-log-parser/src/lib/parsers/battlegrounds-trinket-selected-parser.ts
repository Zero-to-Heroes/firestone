import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsTrinketSelectedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsTrinketSelectedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, helper: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = helper;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		const tagChange = node.Object as TagChange;
		return (
			stateType === StateType.PowerTaskList &&
			this.StateFacade.IsBattlegrounds() &&
			node.Type === TagChange &&
			(tagChange.Name === (GameTag.BACON_FIRST_TRINKET_DATABASE_ID as number) ||
				tagChange.Name === (GameTag.BACON_SECOND_TRINKET_DATABASE_ID as number))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const hero = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (hero?.CardId != null && !hero.IsBaconBartender() && tagChange.Value > 0) {
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'BATTLEGROUNDS_TRINKET_SELECTED',
					() => ({
						Type: 'BATTLEGROUNDS_TRINKET_SELECTED',
						Value: {
							CardId: hero.CardId,
							PlayerId: hero.GetTag(GameTag.PLAYER_ID),
							AdditionalProps: {
								HeroCardId: hero.CardId,
								TrinketDbfId: tagChange.Value,
								IsFirstTrinket:
									tagChange.Name === (GameTag.BACON_FIRST_TRINKET_DATABASE_ID as number),
							},
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
