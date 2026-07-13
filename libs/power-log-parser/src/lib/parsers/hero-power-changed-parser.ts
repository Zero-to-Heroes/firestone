import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { FullEntity, Node, NodeType, ShowEntity } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class HeroPowerChangedParser implements ActionParser {
	readonly ParserName = 'HeroPowerChangedParser';

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
		const appliesOnFullEntity =
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			(node.Object as FullEntity).GetTag(GameTag.CARDTYPE) === (CardType.HERO_POWER as number);
		const appliesOnShowEntity =
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			(node.Object as ShowEntity).GetTag(GameTag.CARDTYPE) === (CardType.HERO_POWER as number);
		return appliesOnFullEntity || appliesOnShowEntity;
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Object instanceof FullEntity) {
			return this.createFromFullEntity(node);
		} else if (node.Object instanceof ShowEntity) {
			return this.createFromShowEntity(node);
		}
		return null;
	}

	private createFromFullEntity(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const cardId = fullEntity.CardId;
		const controllerId = fullEntity.GetEffectiveController();
		const creatorEntityId = fullEntity.GetTag(GameTag.CREATOR);
		const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
			: null;
		const additionalHeroPowerIndex = fullEntity.GetTag(GameTag.ADDITIONAL_HERO_POWER_INDEX);
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'HERO_POWER_CHANGED',
				GameEventHelper.CreateProvider('HERO_POWER_CHANGED', cardId, controllerId, fullEntity.Id, this.StateFacade, {
					CreatorCardId: creatorEntityCardId,
					AdditionalHeroPowerIndex: additionalHeroPowerIndex,
				}),
				true,
				node,
			),
		];
	}

	private createFromShowEntity(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		const cardId = showEntity.CardId;
		const controllerId = showEntity.GetEffectiveController();
		const creatorEntityId = showEntity.GetTag(GameTag.CREATOR);
		const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
			: null;
		const additionalHeroPowerIndex = showEntity.GetTag(GameTag.ADDITIONAL_HERO_POWER_INDEX);
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'HERO_POWER_CHANGED',
				GameEventHelper.CreateProvider(
					'HERO_POWER_CHANGED',
					cardId,
					controllerId,
					showEntity.Entity,
					this.StateFacade,
					{
						CreatorCardId: creatorEntityCardId,
						AdditionalHeroPowerIndex: additionalHeroPowerIndex,
					},
				),
				true,
				node,
			),
		];
	}
}
