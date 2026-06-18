import { CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ChangeEntity, FullEntity, GameEntity, PlayerEntity, ShowEntity, Tag, TagChange } from '../models';
import { Regexes } from '../regexes';
import { GameMetaData } from './game-meta-data';
import { GameStateReport } from './game-state-report';
import type { ParserState } from './parser-state';
import { PlayerReport } from './player-report';
import type { StateFacade } from './state-facade';

export class ParserGameStateLite {
	CurrentEntities: Map<number, FullEntity> = new Map();
	ControllerEntityMap: Map<number, number> = new Map();
}

export class GameState extends ParserGameStateLite {
	ParserState!: ParserState;

	EntityNames: Map<string, number> = new Map();
	CurrentTurn: number = 0;
	MetaData: GameMetaData | null = null;
	NextBgsOpponentPlayerId: number = -1;
	BattleResultSent: boolean = false;
	LastCardPlayedEntityId: number = -1;
	LastCardDrawnEntityId: number = -1;
	CardsPlayedByPlayerEntityIdByTurn: Map<number, Map<number, number[]>> = new Map();
	SpellsPlayedByPlayerOnFriendlyEntityIds: Map<number, number[]> = new Map();
	BgsCurrentBattleOpponent: string | null = null;
	BgsCurrentBattleOpponentPlayerId: number = 0;
	BgsHasSentNextOpponent: boolean = false;

	EntityIdsOnBoardWhenPlayingPotionOfIllusion: Map<number, FullEntity[]> | null = null;

	GameEntityId: number = -1;

	Reset(state: ParserState): void {
		this.ParserState = state;
		this.CurrentEntities = new Map();
		this.EntityNames = new Map();
		this.CurrentTurn = 0;
		this.MetaData = null;
		this.NextBgsOpponentPlayerId = -1;
		this.BattleResultSent = false;
		this.LastCardPlayedEntityId = -1;
		this.CardsPlayedByPlayerEntityIdByTurn = new Map();
		this.SpellsPlayedByPlayerOnFriendlyEntityIds = new Map();
		this.LastCardDrawnEntityId = -1;
		this.BgsCurrentBattleOpponent = null;
		this.BgsCurrentBattleOpponentPlayerId = 0;
		this.BgsHasSentNextOpponent = false;
		this.EntityIdsOnBoardWhenPlayingPotionOfIllusion = null;
		this.GameEntityId = -1;
		this.ControllerEntityMap = new Map();
	}

	GameEntity(entity: GameEntity): void {
		if (this.CurrentEntities.has(entity.Id)) {
			if (!this.ParserState.ReconnectionOngoing) {
				console.debug('error while parsing GameEntity, playerEntity already present in memory', '' + entity.Id);
			}
			return;
		}
		const fullEntity = new FullEntity();
		fullEntity.Id = entity.Id;
		fullEntity.Tags = [];
		fullEntity.TimeStamp = entity.TimeStamp;
		this.CurrentEntities.set(entity.Id, fullEntity);
		this.GameEntityId = entity.Id;
	}

	GetGameEntity(): FullEntity | undefined {
		return this.CurrentEntities.get(this.GameEntityId);
	}

	UpdateEntityName(rawEntity: string): void {
		const match = Regexes.EntityWithNameAndId.exec(rawEntity);
		if (match) {
			const entityName = match[1];
			const entityId = match[2];
			this.EntityNames.set(entityName, parseInt(entityId, 10));
		}
	}

	BuildGameStateReport(helper: StateFacade): GameStateReport | null {
		if (helper.LocalPlayer == null) {
			return null;
		}
		const report = new GameStateReport();
		report.LocalPlayer = PlayerReport.buildPlayerReport(this, helper.LocalPlayer.Id);
		report.OpponentReport = PlayerReport.buildPlayerReport(this, helper.OpponentPlayer!.Id);
		return report;
	}

	PlayerEntity(entity: PlayerEntity): void {
		if (this.CurrentEntities.has(entity.Id)) {
			if (!this.ParserState.ReconnectionOngoing) {
				console.debug('error while parsing, playerEntity already present in memory', '' + entity.Id);
			}
			return;
		}
		const newTags: Tag[] = [];
		for (const oldTag of entity.Tags) {
			const t = new Tag();
			t.Name = oldTag.Name;
			t.Value = oldTag.Value;
			newTags.push(t);
		}
		const fullEntity = new FullEntity();
		fullEntity.Id = entity.Id;
		fullEntity.Tags = newTags;
		fullEntity.TimeStamp = entity.TimeStamp;
		this.CurrentEntities.set(entity.Id, fullEntity);
		this.ControllerEntityMap.set(entity.PlayerId, entity.Id);
	}

	GetController(controllerId: number): FullEntity | undefined {
		const entityId = this.ControllerEntityMap.get(controllerId);
		if (entityId == null) {
			return undefined;
		}
		return this.CurrentEntities.get(entityId);
	}

	FullEntity(entity: FullEntity, updating: boolean): void {
		if (updating) {
			return;
		}

		const newTags = entity.GetTagsCopy();
		const existingEntity = this.CurrentEntities.get(entity.Id);
		const fullEntity = new FullEntity();
		fullEntity.CardId =
			entity.CardId != null && entity.CardId.length > 0 ? entity.CardId : (existingEntity?.CardId ?? '');
		fullEntity.Id = entity.Id > 0 ? entity.Id : (existingEntity?.Id ?? entity.Id);
		fullEntity.TimeStamp = entity.TimeStamp;
		fullEntity.Tags = newTags;
		fullEntity.TagsHistory = newTags.map((tag) => {
			const t = new Tag();
			t.Name = tag.Name;
			t.Value = tag.Value;
			return t;
		});
		this.CurrentEntities.delete(entity.Id);
		this.CurrentEntities.set(entity.Id, fullEntity);
	}

	ShowEntity(entity: ShowEntity): void {
		if (!this.CurrentEntities.has(entity.Entity)) {
			console.debug("error while parsing, showentity doesn't have an entity in memory yet", '' + entity.Entity);
			return;
		}

		const currentEntity = this.CurrentEntities.get(entity.Entity)!;
		currentEntity.CardId = entity.CardId;

		const showStartTag = new Tag();
		showStartTag.Name = GameTag.SHOW_ENTITY_START as number;
		showStartTag.Value = 1;
		currentEntity.TagsHistory.push(showStartTag);
		if (entity.Tags) {
			currentEntity.TagsHistory.push(
				...entity.Tags.map((tag) => {
					const t = new Tag();
					t.Name = tag.Name;
					t.Value = tag.Value;
					return t;
				}),
			);
		}
		const showEndTag = new Tag();
		showEndTag.Name = GameTag.SHOW_ENTITY_END as number;
		showEndTag.Value = 1;
		currentEntity.TagsHistory.push(showEndTag);

		const newTagIds = entity.Tags.map((tag) => tag.Name);
		const oldTagsToKeep = currentEntity.Tags.filter((tag) => !newTagIds.includes(tag.Name)).map((tag) => {
			const t = new Tag();
			t.Name = tag.Name;
			t.Value = tag.Value;
			return t;
		});
		const newTags: Tag[] = [];
		for (const oldTag of entity.Tags) {
			const t = new Tag();
			t.Name = oldTag.Name;
			t.Value = oldTag.Value;
			newTags.push(t);
		}
		oldTagsToKeep.push(...newTags);
		currentEntity.Tags = oldTagsToKeep;
	}

	GetCardIdForEntity(id: number): string | null {
		const entity = this.CurrentEntities.get(id);
		if (entity == null) {
			return null;
		}

		if (entity.CardId != null && entity.CardId.length > 0) {
			return entity.CardId;
		}
		const heroEntity = [...this.CurrentEntities.values()]
			.filter((e) => e.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((e) => e.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
			.find((e) => e.GetEffectiveController() === entity.GetEffectiveController());
		return heroEntity?.CardId ?? null;
	}

	GetPlayerHeroEntity(entityId: number): FullEntity | null {
		const entity = this.CurrentEntities.get(entityId);
		if (entity == null) {
			return null;
		}

		if (this.ParserState.IsMercenaries()) {
			return entity;
		}

		if (entity.CardId != null && entity.CardId.length > 0) {
			return entity;
		}
		let heroesForController = [...this.CurrentEntities.values()]
			.filter((e) => e.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((e) => e.GetEffectiveController() === entity.GetEffectiveController())
			.filter((e) => e.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
			.sort((a, b) => (b.TimeStamp ?? '').localeCompare(a.TimeStamp ?? ''));

		if (heroesForController.length === 0) {
			heroesForController = [...this.CurrentEntities.values()]
				.filter((e) => e.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
				.filter((e) => e.GetEffectiveController() === entity.GetEffectiveController())
				.sort((a, b) => (a.TimeStamp ?? '').localeCompare(b.TimeStamp ?? ''));
		}
		return heroesForController[0] ?? null;
	}

	ChangeEntity(entity: ChangeEntity): void {
		if (!this.CurrentEntities.has(entity.Entity)) {
			console.debug("error while parsing, changeEntity doesn't have an entity in memory yet", '' + entity.Entity);
			return;
		}

		const currentEntity = this.CurrentEntities.get(entity.Entity)!;
		currentEntity.CardId = entity.CardId;
		const newTagIds = entity.Tags.map((tag) => tag.Name);
		const oldTagsToKeep = currentEntity.Tags.filter((tag) => !newTagIds.includes(tag.Name)).map((tag) => {
			const t = new Tag();
			t.Name = tag.Name;
			t.Value = tag.Value;
			return t;
		});
		const newTags: Tag[] = [];
		for (const oldTag of entity.Tags) {
			const t = new Tag();
			t.Name = oldTag.Name;
			t.Value = oldTag.Value;
			newTags.push(t);
		}
		oldTagsToKeep.push(...newTags);
		currentEntity.Tags = oldTagsToKeep;
	}

	TagChange(tagChange: TagChange, defChange: string): void {
		const fullEntity = this.CurrentEntities.get(tagChange.Entity);
		if (!fullEntity) {
			return;
		}

		const existingTag = fullEntity.Tags.find((tag) => tag.Name === tagChange.Name);
		fullEntity.SetTag(tagChange.Name, tagChange.Value);

		const historyTag = new Tag();
		historyTag.Name = tagChange.Name;
		historyTag.Value = tagChange.Value;
		fullEntity.TagsHistory.push(historyTag);

		if (existingTag != null) {
			const prevTag = new Tag();
			prevTag.Name = existingTag.Name;
			prevTag.Value = existingTag.Value;
			fullEntity.AllPreviousTags.push(prevTag);
		}
	}

	Tag(tag: Tag, entityId: number): void {
		if (!this.CurrentEntities.has(entityId)) {
			console.debug("error while parsing, tag doesn't have an entity in memory yet", '' + entityId);
			return;
		}

		const currentEntity = this.CurrentEntities.get(entityId)!;
		currentEntity.SetTag(tag.Name, tag.Value);
	}

	PlayerIdFromEntityName(data: string): number {
		const entityId = this.EntityNames.get(data);
		if (entityId != null && entityId !== 0) {
			let playerId = [...this.CurrentEntities.values()]
				.filter(
					(e) =>
						e.Tags.find((x) => x.Name === (GameTag.HERO_ENTITY as number) && x.Value === entityId) != null,
				)
				.map((e) => e.Id)
				.find(() => true);

			if (playerId == null || playerId === 0) {
				const entity = [...this.CurrentEntities.values()].find((x) => x.Id === entityId);
				const entityControllerId = entity!.GetEffectiveController();
				playerId = this.ParserState.getPlayers().find((x) => x.PlayerId === entityControllerId)!.Id;
			}
			return playerId;
		}
		return 0;
	}

	GetActivePlayerId(): number {
		const activePlayer = [...this.CurrentEntities.values()].find(
			(e) => e.Tags.find((x) => x.Name === (GameTag.CURRENT_PLAYER as number) && x.Value === 1) != null,
		);
		const activePlayerEntityId = activePlayer?.Id;
		for (const data of this.ParserState.CurrentGame.Data) {
			if (data instanceof PlayerEntity) {
				if (data.Id === activePlayerEntityId) {
					return data.PlayerId;
				}
			}
		}
		return -1;
	}

	OnCardPlayed(entityId: number, targetEntityId?: number, fullEntityArg?: FullEntity): void {
		this.LastCardPlayedEntityId = entityId;
		if (this.CurrentEntities.has(entityId)) {
			const currentEntitiesCopy = [...this.CurrentEntities.values()];

			const playedEntity = fullEntityArg ?? this.CurrentEntities.get(entityId)!;

			let cardsForPlayerByTurn = this.CardsPlayedByPlayerEntityIdByTurn.get(playedEntity.GetController());
			if (cardsForPlayerByTurn == null) {
				cardsForPlayerByTurn = new Map();
				this.CardsPlayedByPlayerEntityIdByTurn.set(playedEntity.GetController(), cardsForPlayerByTurn);
			}
			const currentTurn = this.GetGameEntity()!.GetTag(GameTag.TURN);
			let cardsForTurn = cardsForPlayerByTurn.get(currentTurn);
			if (cardsForTurn == null) {
				cardsForTurn = [];
				cardsForPlayerByTurn.set(currentTurn, cardsForTurn);
			}
			cardsForTurn.push(entityId);

			const cardsInHandForController = currentEntitiesCopy
				.filter((e) => e.GetZone() === (Zone.HAND as number))
				.filter((e) => e.GetController() === playedEntity.GetController());
			for (const cardInHand of cardsInHandForController) {
				cardInHand.PlayedWhileInHand.push(playedEntity.Entity);
			}

			const plagiarizes = currentEntitiesCopy.filter((e) => e.GetTag(GameTag.ZONE) === (Zone.SECRET as number));
			if (plagiarizes.length > 0 && playedEntity.GetTag(GameTag.CANT_PLAY) !== 1) {
				plagiarizes.forEach((plagia) => plagia.KnownEntityIds.push(entityId));
			}

			if (playedEntity.CardId === CardIds.PotionOfIllusion) {
				const grouped = currentEntitiesCopy
					.filter((e) => e.GetTag(GameTag.ZONE) === (Zone.PLAY as number))
					.filter((e) => e.GetTag(GameTag.CARDTYPE) === (CardType.MINION as number))
					.sort((a, b) => a.GetTag(GameTag.ZONE_POSITION) - b.GetTag(GameTag.ZONE_POSITION));
				this.EntityIdsOnBoardWhenPlayingPotionOfIllusion = new Map();
				for (const e of grouped) {
					const controller = e.GetEffectiveController();
					if (!this.EntityIdsOnBoardWhenPlayingPotionOfIllusion.has(controller)) {
						this.EntityIdsOnBoardWhenPlayingPotionOfIllusion.set(controller, []);
					}
					this.EntityIdsOnBoardWhenPlayingPotionOfIllusion.get(controller)!.push(e);
				}
			} else {
				this.EntityIdsOnBoardWhenPlayingPotionOfIllusion = null;
			}
		}
	}

	OnCardDrawn(entityId: number): void {
		this.LastCardDrawnEntityId = entityId;
	}

	OnCardDiscarded(discardedEntityId: number, discardedCardId: string, source: FullEntity | null): void {
		if (source == null) {
			return;
		}

		switch (source.CardId) {
			case CardIds.ExpiredMerchant:
			case CardIds.FelsoulJailer:
			case CardIds.FelsoulJailerLegacy:
			case CardIds.AmorphousSlime:
				source.CardIdsToCreate.push(discardedCardId);
				break;
		}
	}

	OnNewTurn(): void {
		if (this.CurrentTurn % 2 === 1) {
			this.BgsCurrentBattleOpponent = null;
			this.BgsCurrentBattleOpponentPlayerId = 0;
		}
	}

	ClearPlagiarize(): void {
		const plagiarizes = [...this.CurrentEntities.values()].filter(
			(e) => e.GetTag(GameTag.ZONE) === (Zone.SECRET as number),
		);
		plagiarizes.forEach((plagia) => (plagia.KnownEntityIds.length = 0));
	}

	FindEnchantmentsAttachedTo(entity: number): FullEntity[] {
		if (!this.CurrentEntities.has(entity)) {
			return [];
		}
		return [...this.CurrentEntities.values()].filter((e) => e.GetTag(GameTag.ATTACHED) === entity);
	}
}
