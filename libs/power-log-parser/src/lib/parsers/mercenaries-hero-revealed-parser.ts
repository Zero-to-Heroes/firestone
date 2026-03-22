import { GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { FullEntity, Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MercenariesHeroRevealedParser implements ActionParser {
	readonly ParserName = 'MercenariesHeroRevealedParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		let fullEntity: FullEntity | null = null;
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === FullEntity &&
			((fullEntity = node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.SETASIDE as number) ||
				fullEntity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) ||
				fullEntity.GetTag(GameTag.ZONE) === (Zone.GRAVEYARD as number)) &&
			fullEntity.GetTag(GameTag.LETTUCE_MERCENARY) === 1
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const cardId = fullEntity.CardId;
		const controllerId = fullEntity.GetEffectiveController();
		const creatorEntityId = fullEntity.GetTag(GameTag.CREATOR);
		const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
			: null;
		const isDead = fullEntity.GetTag(GameTag.ZONE) === (Zone.GRAVEYARD as number);
		const mercXp = fullEntity.GetTag(GameTag.LETTUCE_MERCENARY_EXPERIENCE);
		const mercEquipmentId = fullEntity.GetTag(GameTag.LETTUCE_EQUIPMENT_ID);
		const zone = fullEntity.GetZone();
		const zonePosition = fullEntity.GetZonePosition();
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'MERCENARIES_HERO_REVEALED',
				GameEventHelper.CreateProvider(
					'MERCENARIES_HERO_REVEALED',
					cardId,
					controllerId,
					fullEntity.Id,
					this.StateFacade,
					{
						CreatorCardId: creatorEntityCardId,
						MercenariesExperience: mercXp,
						MercenariesEquipmentId: mercEquipmentId,
						IsDead: isDead,
						ZonePosition: zonePosition,
						Zone: zone,
					},
				),
				true,
				node,
			),
		];
	}
}
