export interface BoardCardOverlay {
	readonly entityId: number;
	readonly cardId: string;
	readonly playOrder: number;
	readonly side: 'player' | 'opponent';
}
