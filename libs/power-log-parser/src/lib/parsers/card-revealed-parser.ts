import { CardIds, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CardRevealedParser implements ActionParser {
	readonly ParserName = 'CardRevealedParser';

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
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === FullEntity &&
			((node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.SETASIDE as number) ||
				(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.REMOVEDFROMGAME as number))
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		let cardId = fullEntity.CardId;
		const controllerId = fullEntity.GetEffectiveController();
		const creatorEntityId = fullEntity.GetTag(GameTag.CREATOR);
		const creatorEntity = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!
			: null;
		let originEntity: FullEntity | null = null;
		if (node.Parent?.Object instanceof Action) {
			const influencerEntityId = (node.Parent.Object as Action).Entity;
			originEntity = this.GameState.CurrentEntities.get(influencerEntityId) ?? null;
		}
		const creatorEntityCardId = creatorEntity?.CardId ?? null;
		const originEntityCardId = originEntity?.CardId ?? null;

		if (
			fullEntity.GetZone() === (Zone.REMOVEDFROMGAME as number) &&
			creatorEntityCardId !== CardIds.SchoolTeacher_NagalingToken
		) {
			return null;
		}

		const mercXp = fullEntity.GetTag(GameTag.LETTUCE_MERCENARY_EXPERIENCE);
		const mercEquipmentId = fullEntity.GetTag(GameTag.LETTUCE_EQUIPMENT_ID);
		let revealedFromBlock: string | null = null;
		let indexInBlock: number | null = null;
		if (node.Parent != null && node.Parent.Object.constructor === Action) {
			const parentAction = node.Parent.Object as Action;
			const parentEntity = this.GameState.CurrentEntities.get(parentAction.Entity);
			const totalOptions = parentAction.Data.filter((data) => data instanceof FullEntity).length;
			indexInBlock = parentAction.Data
				.filter((data): data is FullEntity => data instanceof FullEntity)
				.map((e) => e.Entity)
				.indexOf(fullEntity.Id);
			if (parentEntity?.HasDredge() ?? false) {
				revealedFromBlock = 'DREDGE';
			}
			if (parentEntity?.CardId === CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e) {
				cardId = '';
			}
		}

		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'CARD_REVEALED',
				GameEventHelper.CreateProvider(
					'CARD_REVEALED',
					cardId,
					controllerId,
					fullEntity.Id,
					this.StateFacade,
					{
						CreatorCardId: creatorEntityCardId,
						OriginEntityCardId: originEntityCardId,
						MercenariesExperience: mercXp,
						MercenariesEquipmentId: mercEquipmentId,
						RevealedFromBlock: revealedFromBlock,
						IndexInBlock: indexInBlock,
						Cost: fullEntity.GetCost(),
						Tags: fullEntity.GetTagsCopy(),
					},
				),
				true,
				node,
			),
		];
	}
}
