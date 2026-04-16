import { CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { FullEntity, Node, NodeType, TagChange } from '../models';
import { ShowEntity } from '../models/action';
import { Oracle } from '../oracle';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class SecretCreatedInGameParser implements ActionParser {
	readonly ParserName = 'SecretCreatedInGameParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Value === (Zone.SECRET as number) &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) ===
				(Zone.SETASIDE as number) ||
				this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) ===
					(Zone.REMOVEDFROMGAME as number))
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const appliesFullEntity =
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.SECRET as number);
		const appliesShowEntity =
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.SECRET as number) &&
			(this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)?.GetTag(GameTag.ZONE) ===
				(Zone.REMOVEDFROMGAME as number) ||
				this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)?.GetTag(GameTag.ZONE) ===
					(Zone.SETASIDE as number));
		return appliesFullEntity || appliesShowEntity;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (
			this.GameState.CurrentEntities.get(tagChange.Entity)!.GetTag(GameTag.CARDTYPE) !==
			(CardType.ENCHANTMENT as number)
		) {
			const eventName =
				this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)!.GetTag(GameTag.SECRET) === 1
					? 'SECRET_CREATED_IN_GAME'
					: 'QUEST_CREATED_IN_GAME';
			const playerClass = entity.GetPlayerClass();
			const creator = Oracle.FindCardCreator(this.GameState, entity, node);
			let creatorCardId = creator?.[0] ?? null;
			let creatorEntityId = creator?.[1] ?? -1;
			if (creatorCardId == null) {
				creatorEntityId = creatorEntityId === -1 ? entity.GetTag(GameTag.CREATOR) : creatorEntityId;
				if (creatorEntityId === -1) {
					creatorEntityId = entity.GetTag(GameTag.DISPLAYED_CREATOR);
				}
				creatorCardId = this.GameState.CurrentEntities.get(creatorEntityId)?.CardId ?? null;
			}
			const resolved = this.ResolveDiscoverSourceCreator(creatorCardId, creatorEntityId, node);
			creatorCardId = resolved[0];
			creatorEntityId = resolved[1];
			[creatorCardId, creatorEntityId] = this.applyFyrakkBattlecrySecretCreatorOverride(
				eventName,
				node,
				creatorCardId,
				creatorEntityId,
			);
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					eventName,
					GameEventHelper.CreateProvider(eventName, cardId, controllerId, entity.Id, this.StateFacade, {
						PlayerClass: playerClass,
						CreatorCardId: creatorCardId,
						CreatorEntityId: creatorEntityId,
					}),
					true,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Object instanceof FullEntity) {
			return this.CreateGameEventProviderFromFullEntity(node);
		} else if (node.Object instanceof ShowEntity) {
			return this.CreateGameEventProviderFromShowEntity(node);
		}
		return null;
	}

	private CreateGameEventProviderFromFullEntity(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const controllerId = fullEntity.GetEffectiveController();
		const playerClass = fullEntity.GetPlayerClass();
		const creator = Oracle.FindCardCreator(this.GameState, fullEntity, node);
		const eventName = fullEntity.GetTag(GameTag.SECRET) === 1 ? 'SECRET_CREATED_IN_GAME' : 'QUEST_CREATED_IN_GAME';
		let cardId = fullEntity.CardId;
		if (cardId.length === 0 && fullEntity.GetTag(GameTag.SECRET) === 1 && creator != null) {
			cardId =
				Oracle.PredictSecret(this.GameState, creator[0] ?? '', creator[1] ?? -1, node, fullEntity.CardId) ??
				cardId;
		}
		let resolved = this.ResolveDiscoverSourceCreator(creator?.[0] ?? null, creator?.[1] ?? -1, node);
		resolved = this.applyFyrakkBattlecrySecretCreatorOverride(eventName, node, resolved[0], resolved[1]);
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(eventName, cardId, controllerId, fullEntity.Entity, this.StateFacade, {
					PlayerClass: playerClass,
					CreatorCardId: resolved[0],
					CreatorEntityId: resolved[1],
				}),
				true,
				node,
			),
		];
	}

	private CreateGameEventProviderFromShowEntity(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		const cardId = showEntity.CardId;
		const controllerId = showEntity.GetEffectiveController();
		const playerClass = showEntity.GetPlayerClass();
		const creatorEntityId = showEntity.GetTag(GameTag.CREATOR);
		const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
			: null;
		const eventName = showEntity.GetTag(GameTag.SECRET) === 1 ? 'SECRET_CREATED_IN_GAME' : 'QUEST_CREATED_IN_GAME';
		let resolved = this.ResolveDiscoverSourceCreator(creatorEntityCardId, creatorEntityId, node);
		resolved = this.applyFyrakkBattlecrySecretCreatorOverride(eventName, node, resolved[0], resolved[1]);
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(eventName, cardId, controllerId, showEntity.Entity, this.StateFacade, {
					PlayerClass: playerClass,
					CreatorCardId: resolved[0],
					CreatorEntityId: resolved[1],
				}),
				true,
				node,
			),
		];
	}

	private applyFyrakkBattlecrySecretCreatorOverride(
		eventName: string,
		node: Node,
		creatorCardId: string | null,
		creatorEntityId: number,
	): [string | null, number] {
		if (eventName !== 'SECRET_CREATED_IN_GAME') {
			return [creatorCardId, creatorEntityId];
		}
		const fyrakk = Oracle.FindFyrakkTheBlazingInActionAncestors(this.GameState, node);
		if (fyrakk) {
			return [fyrakk[0], fyrakk[1]];
		}
		return [creatorCardId, creatorEntityId];
	}

	// The Origin Stone plays the unchosen discover options. When it creates a
	// secret, the relevant card pool is determined by the card that initiated
	// the discover (e.g. Alter Time), not the Origin Stone itself.
	private ResolveDiscoverSourceCreator(
		creatorCardId: string | null,
		creatorEntityId: number,
		node: Node,
	): [string | null, number] {
		if (creatorCardId === CardIds.TheForbiddenSequence_TheOriginStoneToken_TLC_460t) {
			const discoverSource = Oracle.FindParentEntity(this.GameState, node.Parent!);
			if (discoverSource != null) {
				return discoverSource;
			}
		}
		return [creatorCardId, creatorEntityId];
	}
}
