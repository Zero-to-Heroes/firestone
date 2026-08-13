import { BlockType, CardIds, CardType, GameTag, MetaTags, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, MetaData, Node, NodeType, ShowEntity, Tag, TagChange } from '../models';
import { Oracle } from '../oracle';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const ExcessAmountCardConfig: Map<string, { SpellAmount: number; MetaType: number }> = new Map([
	[CardIds.InvasiveShadeleaf_WW_393, { SpellAmount: 10, MetaType: MetaTags.DAMAGE }],
	[CardIds.HolySpringwater_WW_395, { SpellAmount: 10, MetaType: MetaTags.HEALING }],
	[CardIds.Torch_CATA_585, { SpellAmount: 8, MetaType: MetaTags.DAMAGE }],
]);

export class ReceiveCardInHandParser implements ActionParser {
	readonly ParserName = 'ReceiveCardInHandParser';

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
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(node.Object as TagChange).Value === (Zone.HAND as number) &&
			this.GameState.CurrentEntities.has((node.Object as TagChange).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)!.GetTag(GameTag.ZONE) !==
				(Zone.DECK as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const appliesToShowEntity =
			node.Type === NodeType.ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.HAND as number) &&
			(!this.GameState.CurrentEntities.has((node.Object as ShowEntity).Entity) ||
				(this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)!.GetTag(GameTag.ZONE) !==
					(Zone.DECK as number) &&
					this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)!.GetTag(GameTag.ZONE) !==
						(Zone.HAND as number)));
		const appliesToFullEntity =
			node.Type === NodeType.FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.HAND as number) &&
			(!this.GameState.CurrentEntities.has((node.Object as FullEntity).Id) ||
				(this.GameState.CurrentEntities.get((node.Object as FullEntity).Id)!.GetTag(GameTag.ZONE) !==
					(Zone.DECK as number) &&
					this.GameState.CurrentEntities.get((node.Object as FullEntity).Id)!.GetTag(GameTag.ZONE) !==
						(Zone.HAND as number)));
		return stateType === StateType.PowerTaskList && (appliesToShowEntity || appliesToFullEntity);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		let cardId: string | null = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const creator = Oracle.FindCardCreator(this.GameState, entity, node);
		let guessedTags: Tag[] | null = null;
		if (creator?.[1] != null && (!cardId || cardId === '')) {
			cardId = Oracle.PredictCardId(
				this.GameState,
				creator?.[0],
				creator?.[1] ?? -1,
				node,
				null,
				this.StateFacade,
				tagChange.Entity,
			);
			guessedTags = Oracle.GuessTags(
				this.GameState,
				creator?.[0],
				creator?.[1] ?? -1,
				node,
				null,
				this.StateFacade,
			);
		}

		const creatorEntity = this.GameState.CurrentEntities.get(creator?.[1] ?? -1);
		let createdIndex: number | null = null;
		let creatorZone: number | null = null;
		let creatorTags: Tag[] | null = null;
		if (creatorEntity != null) {
			createdIndex = creatorEntity.CreatedIndex;
			creatorEntity.CreatedIndex++;
			creatorZone = creatorEntity.GetZone();
			creatorTags = creatorEntity.GetTagsCopy();
		}

		const lastInfluencedByCardId =
			this.GameState.CurrentEntities.get((node.Parent?.Object as Action)?.Entity ?? -1)?.CardId ??
			creator?.[0] ??
			null;
		entity.PlayedWhileInHand.length = 0;
		const position = entity.GetZonePosition();

		const excessAmount = this.getExcessAmountFromCreatorBlock(node, creator?.[0] ?? null, creator?.[1] ?? -1);
		const storedAmount = this.storedAmountPreferringPerEntityScript(entity, creator?.[0] ?? null, excessAmount);

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'RECEIVE_CARD_IN_HAND',
				GameEventHelper.CreateProvider(
					'RECEIVE_CARD_IN_HAND',
					cardId ?? (null as any),
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						CreatorCardId: creator?.[0] ?? null,
						CreatorEntityId: creator?.[1] ?? null,
						CreatedIndex: createdIndex,
						CreatorZone: creatorZone,
						CreatorTags: creatorTags,
						LastInfluencedByCardId: lastInfluencedByCardId,
						IsPremium: entity.GetTag(GameTag.PREMIUM) === 1,
						Position: position,
						GuessedTags: guessedTags,
						Tags: entity.GetTagsCopy(),
						StoredAmount: storedAmount,
					},
				),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Type === NodeType.ShowEntity) {
			return this.createEventFromShowEntity(node);
		} else if (node.Type === NodeType.FullEntity) {
			return this.createEventFromFullEntity(node);
		}
		return null;
	}

	private createEventFromShowEntity(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		const creator = Oracle.FindCardCreatorFromShowEntity(this.GameState, showEntity, node);
		const creatorEntity = this.GameState.CurrentEntities.get(creator?.[1] ?? -1);
		let createdIndex: number | null = null;
		let creatorZone: number | null = null;
		let creatorTags: Tag[] | null = null;
		if (creatorEntity != null) {
			createdIndex = creatorEntity.CreatedIndex;
			creatorEntity.CreatedIndex++;
			creatorZone = creatorEntity.GetZone();
			creatorTags = creatorEntity.GetTagsCopy();
		}
		const cardId = Oracle.PredictCardId(
			this.GameState,
			creator?.[0] ?? null,
			creator?.[1] ?? -1,
			node,
			showEntity.CardId,
		);
		const controllerId = showEntity.GetEffectiveController();
		const entity = this.GameState.CurrentEntities.get(showEntity.Entity)!;
		entity.PlayedWhileInHand.length = 0;
		const dataNum1 = showEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
		const dataNum2 = showEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2);
		const position = showEntity.GetZonePosition();

		const lastInfluencedBy = Oracle.FindParentEntity(this.GameState, node);
		const lastInfluencedByCardId = lastInfluencedBy != null ? lastInfluencedBy?.[0] : (creator?.[0] ?? null);
		const excessAmount = this.getExcessAmountFromCreatorBlock(node, creator?.[0] ?? null, creator?.[1] ?? -1);
		const storedAmount = this.storedAmountPreferringPerEntityScript(entity, creator?.[0] ?? null, excessAmount);
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'RECEIVE_CARD_IN_HAND',
				GameEventHelper.CreateProvider(
					'RECEIVE_CARD_IN_HAND',
					cardId ?? (null as any),
					controllerId,
					showEntity.Entity,
					this.StateFacade,
					{
						CreatorCardId: creator?.[0] ?? null,
						CreatorEntityId: creator?.[1] ?? null,
						CreatedIndex: createdIndex,
						CreatorZone: creatorZone,
						CreatorTags: creatorTags,
						LastInfluencedByCardId: lastInfluencedByCardId,
						IsPremium: entity.GetTag(GameTag.PREMIUM) === 1 || showEntity.GetTag(GameTag.PREMIUM) === 1,
						DataNum1: dataNum1,
						DataNum2: dataNum2,
						Position: position,
						Tags: entity.GetTagsCopy(),
						StoredAmount: storedAmount,
					},
				),
				true,
				node,
			),
		];
	}

	private createEventFromFullEntity(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const controllerId = fullEntity.GetEffectiveController();
		let previousZone = 0;
		if (this.GameState.CurrentEntities.has(fullEntity.Id)) {
			previousZone = this.GameState.CurrentEntities.get(fullEntity.Id)!.GetTag(GameTag.ZONE);
			this.GameState.CurrentEntities.get(fullEntity.Id)!.PlayedWhileInHand.length = 0;
		}

		let parentAction: Action | null = null;
		if (node.Parent?.Type === NodeType.Action) {
			parentAction = node.Parent.Object as Action;
		}

		let additionalPlayInfo: number | null = null;
		if (fullEntity.GetTag(GameTag.ADDITIONAL_PLAY_REQS_1) !== -1) {
			additionalPlayInfo = fullEntity.GetTag(GameTag.ADDITIONAL_PLAY_REQS_1);
		}

		let referencedCardIds: string[] = [];
		if (fullEntity.CardId === CardIds.TheRyecleaver_MinionSandwichToken_VAC_525t2) {
			if (parentAction != null) {
				const parentEntity = this.GameState.CurrentEntities.get(parentAction.Entity);
				if (parentEntity != null) {
					referencedCardIds = parentAction.Data.filter((d) => d instanceof TagChange)
						.map((d) => d as unknown as TagChange)
						.filter((t) => t.Name === (GameTag.ZONE as number) && t.Value === (Zone.SETASIDE as number))
						.map((t) => this.GameState.CurrentEntities.get(t.Entity))
						.filter((e) => e?.GetCardType() === (CardType.MINION as number))
						.map((e) => e!.CardId);
				}
			}
		}

		const dataNum1 = fullEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
		const dataNum2 = fullEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2);
		const position = fullEntity.GetZonePosition();

		const creator = Oracle.FindCardCreator(this.GameState, fullEntity, node);
		const creatorEntity = this.GameState.CurrentEntities.get(creator?.[1] ?? -1);
		let createdIndex: number | null = null;
		let creatorZone: number | null = null;
		let creatorTags: Tag[] | null = null;
		if (creatorEntity != null) {
			createdIndex = creatorEntity.CreatedIndex;
			creatorEntity.CreatedIndex++;
			creatorZone = creatorEntity.GetZone();
			creatorTags = creatorEntity.GetTagsCopy();
		}

		let creatorCardId = creator?.[0] ?? null;
		let creatorEntityId = creator?.[1] ?? null;

		const lastInfluencedBy = Oracle.FindParentEntity(this.GameState, node);
		const lastInfluencedByCardId = lastInfluencedBy != null ? lastInfluencedBy?.[0] : (creator?.[0] ?? null);
		let cardId = Oracle.PredictCardId(
			this.GameState,
			creatorCardId,
			creator?.[1] ?? -1,
			node,
			fullEntity.CardId,
			this.StateFacade,
			fullEntity.Entity,
			fullEntity.SubSpellInEffect,
		);
		if (cardId == null && this.GameState.CurrentTurn <= 1 && fullEntity.GetTag(GameTag.ZONE_POSITION) === 5) {
			const controller = this.GameState.GetController(fullEntity.GetEffectiveController());
			if (controller?.GetTag(GameTag.CURRENT_PLAYER) !== 1) {
				cardId = 'GAME_005';
				creatorCardId = 'GAME_005';
			}
		}
		if (
			cardId == null &&
			(parentAction?.SubSpells?.some((s) => s.Prefab === 'BARFX_RankedSpell_Upgrade_Impact_Sneaky_Rogue') ??
				false)
		) {
			cardId = 'MIXED_CONCOCTION_UNKNOWN';
			creatorCardId = 'MIXED_CONCOCTION_UNKNOWN';
		}
		const buffingCardEntityCardId = Oracle.GetBuffingCardCardId(creator?.[1] ?? -1, creatorCardId);
		const buffCardId = Oracle.GetBuffCardId(creator?.[1] ?? -1, creatorCardId);

		const guessedTags = Oracle.GuessTags(
			this.GameState,
			creator?.[0],
			creator?.[1] ?? -1,
			node,
			null,
			this.StateFacade,
		);
		const tags = fullEntity.GetTagsCopy();
		if (guessedTags != null) {
			tags.push(...guessedTags);
		}
		const excessAmount = this.getExcessAmountFromCreatorBlock(node, creator?.[0] ?? null, creator?.[1] ?? -1);
		const liveEntity = this.GameState.CurrentEntities.get(fullEntity.Id) ?? fullEntity;
		const storedAmount = this.storedAmountPreferringPerEntityScript(liveEntity, creator?.[0] ?? null, excessAmount);

		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'RECEIVE_CARD_IN_HAND',
				GameEventHelper.CreateProvider(
					'RECEIVE_CARD_IN_HAND',
					cardId ?? (null as any),
					controllerId,
					fullEntity.Id,
					this.StateFacade,
					{
						CreatorCardId: creatorCardId ?? (fullEntity.GetTag(GameTag.CREATOR) > 0 ? 'Unknown' : null),
						CreatorEntityId: creatorEntityId ?? fullEntity.GetTag(GameTag.CREATOR),
						CreatorZone: creatorZone,
						CreatedIndex: createdIndex,
						CreatorTags: creatorTags,
						LastInfluencedByCardId: lastInfluencedByCardId,
						IsPremium: fullEntity.GetTag(GameTag.PREMIUM) === 1,
						BuffingEntityCardId: buffingCardEntityCardId,
						BuffCardId: buffCardId,
						AdditionalPlayInfo: additionalPlayInfo,
						DataNum1: dataNum1,
						DataNum2: dataNum2,
						Position: position,
						ReferencedCardIds: referencedCardIds,
						GuessedTags: tags,
						StoredAmount: storedAmount,
					},
				),
				true,
				node,
			),
		];
	}

	/**
	 * Invasive Shadeleaf / Holy Springwater can create multiple tokens in one cast; each token’s
	 * TAG_SCRIPT_DATA_NUM_1 is authoritative. {@link getExcessAmountFromCreatorBlock} only sees the
	 * first spell meta line, so all bottles would share one wrong StoredAmount.
	 */
	private storedAmountPreferringPerEntityScript(
		entity: FullEntity,
		creatorCardId: string | null,
		excessFromSpellBlock: number | null,
	): number | null {
		const script = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
		if (script > 0) {
			if (
				creatorCardId === CardIds.InvasiveShadeleaf_WW_393 ||
				creatorCardId === CardIds.HolySpringwater_WW_395 ||
				entity.CardId === CardIds.InvasiveShadeleaf_BottledShadeleafToken_WW_393t ||
				entity.CardId === CardIds.HolySpringwater_BottledSpringwaterToken_WW_395t
			) {
				return script;
			}
		}
		return excessFromSpellBlock;
	}

	private getExcessAmountFromCreatorBlock(
		node: Node,
		creatorCardId: string | null,
		creatorEntityId: number,
	): number | null {
		if (!creatorCardId || creatorEntityId <= 0) return null;

		if (creatorCardId === CardIds.BlackwingExperiment_CATA_464) {
			const creatorEntity = this.GameState.CurrentEntities.get(creatorEntityId);
			if (creatorEntity != null) {
				const atk = creatorEntity.GetTag(GameTag.ATK);
				return atk > 0 ? atk : null;
			}
		}

		const config = ExcessAmountCardConfig.get(creatorCardId);
		if (!config) return null;

		let n = node.Parent;
		let playAction: Action | null = null;
		while (n != null) {
			if (
				n.Object instanceof Action &&
				(n.Object as Action).Type === (BlockType.PLAY as number) &&
				(n.Object as Action).Entity === creatorEntityId
			) {
				playAction = n.Object as Action;
				break;
			}
			n = n.Parent;
		}
		if (playAction == null) return null;

		const powerBlock = playAction.Data.filter(
			(a): a is Action =>
				a instanceof Action &&
				(a as Action).Type === (BlockType.POWER as number) &&
				(a as Action).Entity === creatorEntityId,
		)[0];
		const meta = powerBlock?.Data?.filter(
			(m): m is MetaData => m instanceof MetaData && (m as MetaData).Meta === config.MetaType,
		)[0];
		if (meta == null) return null;

		let spellAmount = config.SpellAmount;
		if (creatorCardId === CardIds.Torch_CATA_585) {
			const torchEntity = this.GameState.CurrentEntities.get(creatorEntityId);
			const scriptDamage = torchEntity?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1) ?? -1;
			if (scriptDamage > 0) {
				spellAmount = scriptDamage;
			}
		}

		const excess = spellAmount - meta.Data;
		return excess > 0 ? excess : null;
	}
}
