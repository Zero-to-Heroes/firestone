import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BloodGemBuffChangedParser implements ActionParser {
	readonly ParserName = 'BloodGemBuffChangedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			((node.Object as TagChange).Name === (GameTag.BACON_BLOODGEMBUFFATKVALUE as number) ||
				(node.Object as TagChange).Name === (GameTag.BACON_BLOODGEMBUFFHEALTHVALUE as number))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity == null) {
			return null;
		}

		const controller = entity.GetController();
		if (controller !== this.StateFacade.LocalPlayer!.PlayerId) {
			return null;
		}

		const atk =
			tagChange.Name === (GameTag.BACON_BLOODGEMBUFFATKVALUE as number)
				? tagChange.Value
				: entity.GetTag(GameTag.BACON_BLOODGEMBUFFATKVALUE, 0);
		const health =
			tagChange.Name === (GameTag.BACON_BLOODGEMBUFFHEALTHVALUE as number)
				? tagChange.Value
				: entity.GetTag(GameTag.BACON_BLOODGEMBUFFHEALTHVALUE, 0);
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BLOOD_GEM_BUFF_CHANGED',
				GameEventHelper.CreateProvider(
					'BLOOD_GEM_BUFF_CHANGED',
					null as any,
					entity.GetEffectiveController(),
					entity.Id,
					this.StateFacade,
					{
						Attack: atk,
						Health: health,
					},
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
