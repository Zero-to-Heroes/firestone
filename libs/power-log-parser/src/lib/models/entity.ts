import { CardClass, CardIds, CardType, GameTag, GameType, Zone } from '@firestone-hs/reference-data';
import { GameData } from './game-data';
import { Tag, TagChange } from './tag';
import type { ShowEntity } from './action';
import type { SubSpell } from './sub-spell';

export abstract class BaseEntity extends GameData {
	Id: number = 0;
	Tags: Tag[] = [];
	TagsHistory: Tag[] = [];
	AllPreviousTags: Tag[] = [];

	GetTag(tag: GameTag, defaultValue: number = -1): number {
		const match = this.Tags.find((t) => t.Name === tag);
		return match == null ? defaultValue : match.Value;
	}

	HasTag(tag: GameTag): boolean {
		const match = this.Tags.find((t) => t.Name === tag);
		return match == null ? false : match.Value > 0;
	}

	GetTagSecure(tag: GameTag, defaultValue: number = -1): number {
		const match = [...this.Tags].find((t) => t.Name === tag);
		return match == null ? defaultValue : match.Value;
	}

	TakesBoardSpace(): boolean {
		return (
			this.GetTag(GameTag.CARDTYPE) === CardType.MINION ||
			this.GetTag(GameTag.CARDTYPE) === CardType.LOCATION ||
			this.GetTag(GameTag.CARDTYPE) === CardType.BATTLEGROUND_SPELL
		);
	}

	SetTag(tag: GameTag, value: number): BaseEntity {
		let existing = this.Tags.find((t) => t.Name === tag);
		if (existing == null) {
			existing = new Tag();
			existing.Name = tag;
			existing.Value = value;
			this.Tags.push(existing);
		}
		existing.Value = value;
		return this;
	}

	GetCost(): number | null {
		return this.GetTag(GameTag.COST, -1) === -1 ? null : this.GetTag(GameTag.COST, 0);
	}

	GetEffectiveController(): number {
		const lettuceControllerId = this.GetTag(GameTag.LETTUCE_CONTROLLER);
		if (lettuceControllerId !== -1) {
			return lettuceControllerId;
		}
		return this.GetTag(GameTag.CONTROLLER);
	}

	GetTagsCopy(tagChange?: TagChange): Tag[] {
		const tagsCopy: Tag[] = [];
		let processedNewTagName = false;
		for (const tag of this.Tags) {
			if (tagChange != null && tagChange.Name === tag.Name) {
				processedNewTagName = true;
				const t = new Tag();
				t.Name = tag.Name;
				t.Value = tagChange.Value;
				tagsCopy.push(t);
			} else {
				const t = new Tag();
				t.Name = tag.Name;
				t.Value = tag.Value;
				tagsCopy.push(t);
			}
		}
		if (tagChange != null && !processedNewTagName) {
			const t = new Tag();
			t.Name = tagChange.Name;
			t.Value = tagChange.Value;
			tagsCopy.push(t);
		}
		return tagsCopy;
	}
}

function isBaconGhost(cardId: string): boolean {
	return (
		cardId === CardIds.LadyDeathwhisper_TB_BaconShop_HERO_Deathwhisper ||
		cardId === CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad
	);
}

function isBaconBartender(cardId: string): boolean {
	return cardId?.startsWith(CardIds.BartenderBob) ?? false;
}

function isBaconEnchantment(cardId: string): boolean {
	return (
		cardId === CardIds.BaconphheroHeroic ||
		cardId === CardIds.TagtransferplayerenchantDntEnchantment_Bacon_TagTransferPlayerE
	);
}

export class FullEntity extends BaseEntity {
	static MANUAL_DREDGE: string[] = [CardIds.FromTheDepths, CardIds.Waveshaping_TIME_701];

	CardId: string = '';
	Hidden: boolean = false;

	get Entity(): number {
		return this.Id;
	}
	set Entity(value: number) {
		this.Id = value;
	}

	KnownEntityIds: number[] = [];
	PlayedWhileInHand: number[] = [];
	CardIdsToCreate: string[] = [];
	DynamicInfo: any[] = [];
	CreatedIndex: number = 0;
	SubSpellInEffect: SubSpell | null = null;

	Clone(): FullEntity {
		const clone = new FullEntity();
		clone.CardId = this.CardId;
		clone.Id = this.Id;
		clone.Hidden = this.Hidden;
		clone.TimeStamp = this.TimeStamp;
		clone.InternalParent = this.InternalParent;
		clone.Tags = this.Tags.map((t) => {
			const tag = new Tag();
			tag.Name = t.Name;
			tag.Value = t.Value;
			return tag;
		});
		clone.TagsHistory = this.TagsHistory.map((t) => {
			const tag = new Tag();
			tag.Name = t.Name;
			tag.Value = t.Value;
			return tag;
		});
		clone.AllPreviousTags = this.AllPreviousTags.map((t) => {
			const tag = new Tag();
			tag.Name = t.Name;
			tag.Value = t.Value;
			return tag;
		});
		clone.KnownEntityIds = [...this.KnownEntityIds];
		clone.PlayedWhileInHand = [...this.PlayedWhileInHand];
		clone.CardIdsToCreate = [...this.CardIdsToCreate];
		clone.DynamicInfo = [...this.DynamicInfo];
		clone.CreatedIndex = this.CreatedIndex;
		clone.SubSpellInEffect = this.SubSpellInEffect;
		return clone;
	}

	GetPlayerClass(): string {
		const playerClass = this.GetTag(GameTag.CLASS);
		return CardClass[playerClass];
	}

	GetController(): number {
		return this.GetTag(GameTag.CONTROLLER);
	}

	InHand(): boolean {
		return this.GetZone() === Zone.HAND;
	}

	InGraveyard(): boolean {
		return this.GetZone() === Zone.GRAVEYARD;
	}

	GetZone(tagChange?: TagChange): number {
		if (tagChange != null && tagChange.Name === GameTag.ZONE && tagChange.Entity === this.Entity) {
			return tagChange.Value;
		}
		return this.GetTag(GameTag.ZONE);
	}

	IsMinionLike(): boolean {
		return (
			this.GetTag(GameTag.CARDTYPE) === CardType.MINION ||
			this.GetTag(GameTag.CARDTYPE) === CardType.LOCATION ||
			this.GetTag(GameTag.CARDTYPE) === CardType.BATTLEGROUND_SPELL
		);
	}

	IsLocation(): boolean {
		return this.GetTag(GameTag.CARDTYPE) === CardType.LOCATION;
	}

	GetZonePosition(): number {
		if (this.GetTag(GameTag.FAKE_ZONE_POSITION) >= 0) {
			return this.GetTag(GameTag.FAKE_ZONE_POSITION);
		}
		return this.GetTag(GameTag.ZONE_POSITION);
	}

	IsImmolateDiscard(): boolean {
		return this.GetTag(GameTag.IMMOLATING) === 1 && this.GetTag(GameTag.IMMOLATESTAGE) === 3;
	}

	GetCardType(): number {
		return this.GetTag(GameTag.CARDTYPE);
	}

	IsHero(): boolean {
		return this.GetCardType() === CardType.HERO;
	}

	IsInPlay(tagChange?: TagChange): boolean {
		if (tagChange != null) {
			if (tagChange.Name !== GameTag.ZONE || tagChange.Entity !== this.Entity) {
				return this.GetZone() === Zone.PLAY;
			}
			return tagChange.Value === Zone.PLAY;
		}
		return this.GetZone() === Zone.PLAY;
	}

	IsInGraveyard(): boolean {
		return this.GetZone() === Zone.GRAVEYARD;
	}

	HasDredge(): boolean {
		return this.GetTag(GameTag.DREDGE) === 1 || this.IsManualDredge();
	}

	private IsManualDredge(): boolean {
		return FullEntity.MANUAL_DREDGE.includes(this.CardId);
	}

	IsBaconGhost(): boolean {
		return this.GetTag(GameTag.BACON_IS_KEL_THUZAD) === 1 || isBaconGhost(this.CardId);
	}

	IsBaconBartender(): boolean {
		return this.GetTag(GameTag.BACON_BOB_SKIN) === 1 || isBaconBartender(this.CardId);
	}

	IsBaconEnchantment(): boolean {
		return isBaconEnchantment(this.CardId);
	}

	IsMinion(): boolean {
		return this.GetTag(GameTag.CARDTYPE) === CardType.MINION;
	}

	IsSpell(): boolean {
		return this.GetTag(GameTag.CARDTYPE) === CardType.SPELL;
	}

	GetLeaderboardPosition(gameType: GameType): number {
		if (
			gameType === GameType.GT_BATTLEGROUNDS_DUO ||
			gameType === GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY ||
			gameType === GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI ||
			gameType === GameType.GT_BATTLEGROUNDS_DUO_VS_AI
		) {
			return (
				this.GetTag(GameTag.PLAYER_LEADERBOARD_PLACE) * 2 -
				this.GetTag(GameTag.BACON_DUO_PLAYER_FIGHTS_FIRST_NEXT_COMBAT, 0)
			);
		}
		return this.GetTag(GameTag.PLAYER_LEADERBOARD_PLACE);
	}

	IsStarshipPiece(): boolean {
		return this.GetTag(GameTag.STARSHIP_PIECE) === 1;
	}

	static FromShowEntity(showEntity: ShowEntity): FullEntity {
		const entity = new FullEntity();
		entity.CardId = showEntity.CardId;
		entity.Entity = showEntity.Entity;
		entity.Tags = showEntity.Tags;
		return entity;
	}
}

export class GameEntity extends BaseEntity {}

export class PlayerEntity extends BaseEntity {
	AccountHi: string = '';
	AccountLo: string = '';
	PlayerId: number = 0;
	Name: string = '';
	InitialName: string = '';
	Rank: string = '';
	LegendRank: string = '';
	Cardback: string = '';
	IsMainPlayer: boolean = false;
}
