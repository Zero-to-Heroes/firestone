export class SubSpell {
	Timestamp: string = '';
	Prefab: string = '';
	Source: number = 0;
	Targets: number[] = [];

	private _spell: SubSpell | null = null;
	private _parent: SubSpell | null = null;

	get Spell(): SubSpell | null {
		return this._spell;
	}

	set Spell(value: SubSpell | null) {
		this._spell = value;
		if (this._spell != null) {
			this._spell._parent = this;
		}
	}

	get Parent(): SubSpell | null {
		return this._parent;
	}

	GetActiveSubSpell(): SubSpell {
		let current: SubSpell = this;
		while (current?.Spell != null) {
			current = current.Spell;
		}
		return current;
	}
}
