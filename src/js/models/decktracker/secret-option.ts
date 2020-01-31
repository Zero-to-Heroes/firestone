export class SecretOption {
	readonly cardId: string;
	readonly isValidOption: boolean;

	public static create(cardId: string): SecretOption {
		return Object.assign(new SecretOption(), {
			cardId: cardId,
			isValidOption: true,
		} as SecretOption);
	}
}
