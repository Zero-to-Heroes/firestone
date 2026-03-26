import { CardClass, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { GameAction } from './game-action';
import { GameData } from './game-data';
import { Tag } from './tag';
import { Choice } from './meta';
import type { SubSpell } from './sub-spell';

export interface IEntityData {
	TimeStamp: string;
	CardId: string;
	Entity: number;
	Tags: Tag[];
}

export class Action extends GameAction {
	Index: number = 0;
	EffectIndex: number = 0;
	Target: number = 0;
	Type: number = 0;
	SubOption: number = 0;
	TriggerKeyword: number = 0;
	Data: GameData[] = [];
	SubSpells: SubSpell[] = [];
	DebugCreationLine: string = '';
	Processed: boolean = false;

	AddData(data: GameData): void {
		this.Data.push(data);
	}

	GetDataRecursive(): GameData[] {
		const result: GameData[] = [];
		for (const data of this.Data) {
			result.push(data);
			if (data instanceof Action) {
				result.push(...data.GetDataRecursive());
			}
		}
		return result;
	}
}

export class ShowEntity extends GameData implements IEntityData {
	CardId: string = '';
	Entity: number = 0;
	Tags: Tag[] = [];
	SubSpellInEffect: SubSpell | null = null;

	GetTag(tag: GameTag, defaultValue: number = -1): number {
		const match = this.Tags.find((t) => t.Name === tag);
		return match == null ? defaultValue : match.Value;
	}

	GetPlayerClass(): string {
		const playerClass = this.GetTag(GameTag.CLASS);
		return CardClass[playerClass];
	}

	GetCardType(): number {
		return this.GetTag(GameTag.CARDTYPE);
	}

	GetZone(): number {
		return this.GetTag(GameTag.ZONE);
	}

	GetZonePosition(): number {
		return this.GetTag(GameTag.ZONE_POSITION);
	}

	GetCost(): number {
		return this.GetTag(GameTag.COST, 0);
	}

	GetEffectiveController(): number {
		const lettuceControllerId = this.GetTag(GameTag.LETTUCE_CONTROLLER);
		if (lettuceControllerId !== -1) {
			return lettuceControllerId;
		}
		return this.GetTag(GameTag.CONTROLLER);
	}

	IsInPlay(): boolean {
		return this.GetTag(GameTag.ZONE) === Zone.PLAY;
	}

	IsImmolateDiscard(): boolean {
		return this.GetTag(GameTag.IMMOLATING) === 1 && this.GetTag(GameTag.IMMOLATESTAGE) === 3;
	}

	IsMinionLike(): boolean {
		return (
			this.GetTag(GameTag.CARDTYPE) === CardType.MINION ||
			this.GetTag(GameTag.CARDTYPE) === CardType.LOCATION ||
			this.GetTag(GameTag.CARDTYPE) === CardType.BATTLEGROUND_SPELL
		);
	}

	GetTagsCopy(): Tag[] {
		return this.Tags.map((t) => {
			const tag = new Tag();
			tag.Name = t.Name;
			tag.Value = t.Value;
			return tag;
		});
	}
}

export class HideEntity extends GameData {
	Entity: number = 0;
	Zone: number = 0;
}

export class ChangeEntity extends GameData {
	CardId: string = '';
	Entity: number = 0;
	Tags: Tag[] = [];

	GetTag(tag: GameTag, defaultValue: number = -1): number {
		const match = this.Tags.find((t) => t.Name === tag);
		return match == null ? defaultValue : match.Value;
	}
}

export class ShuffleDeck extends GameAction {
	PlayerId: number = 0;

	Equals(obj: any): boolean {
		if (!(obj instanceof ShuffleDeck)) return false;
		return obj.PlayerId === this.PlayerId;
	}
}

export class ChosenEntities extends GameData {
	Entity: number = 0;
	PlayerId: number = 0;
	Count: number = 0;
	Choices: Choice[] = [];
}
