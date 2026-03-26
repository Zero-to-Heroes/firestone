import { GameTag } from '@firestone-hs/reference-data';
import { GameAction } from './game-action';
import type { SubSpell } from './sub-spell';

export class Tag {
	Name: number = 0;
	Value: number = 0;

	toString(): string {
		const tagName = GameTag[this.Name];
		if (!tagName) {
			return `${this.Name}: ${this.Value}`;
		}
		return `${tagName}: ${this.Value}`;
	}
}

export class TagChange extends GameAction {
	Name: number = 0;
	Value: number = 0;
	DefChange: string = '';
	SubSpellInEffect: SubSpell | null = null;

	Equals(obj: any): boolean {
		if (!(obj instanceof TagChange)) return false;
		return (
			obj.Entity === this.Entity &&
			obj.Name === this.Name &&
			obj.Value === this.Value &&
			obj.DefChange === this.DefChange
		);
	}
}
