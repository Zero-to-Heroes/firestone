import { SecretOption } from './secret-option';

export class BoardSecret {
	readonly entityId: number;
	readonly allPossibleOptions: readonly SecretOption[];

	public static create(entityId: number, options: readonly string[]): BoardSecret {
		return Object.assign(new BoardSecret(), {
			entityId: entityId,
			allPossibleOptions: options.map(option => SecretOption.create(option)),
		} as BoardSecret);
	}
}
