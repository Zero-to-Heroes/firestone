export interface InternalCardInfo {
	readonly cardId: string;
	readonly cardType: 'NORMAL' | 'GOLDEN';
	readonly isNew: boolean;
	readonly isSecondCopy: boolean;
}
