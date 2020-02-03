import { SecretOption } from './secret-option';

export class BoardSecret {
	readonly entityId: number;
	readonly allPossibleOptions: readonly SecretOption[];

	public static create(entityId: number, options: readonly string[]): BoardSecret {
		return Object.assign(new BoardSecret(), {
			entityId: entityId,
			allPossibleOptions: options.map(option => SecretOption.create(option)) as readonly SecretOption[],
		} as BoardSecret);
	}

	public update(value: BoardSecret): BoardSecret {
		return Object.assign(new BoardSecret(), this, value);
	}
}
