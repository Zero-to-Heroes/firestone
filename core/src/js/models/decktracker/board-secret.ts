import { SecretOption } from './secret-option';

export class BoardSecret {
	readonly entityId: number;
	// Useful when a secret is stolen for instance
	readonly cardId: string;
	readonly allPossibleOptions: readonly SecretOption[];

	public static create(entityId: number, cardId: string, options: readonly string[]): BoardSecret {
		return Object.assign(new BoardSecret(), {
			entityId: entityId,
			cardId: cardId,
			allPossibleOptions: !!cardId
				? [SecretOption.create(cardId)]
				: ((options ?? []).map((option) => SecretOption.create(option)) as readonly SecretOption[]),
		} as BoardSecret);
	}

	public update(value: BoardSecret): BoardSecret {
		return Object.assign(new BoardSecret(), this, value);
	}
}
