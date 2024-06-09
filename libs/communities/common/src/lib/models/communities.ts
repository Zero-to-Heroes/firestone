export interface Community {
	readonly id: string;
	readonly name: string;
	readonly type: 'constructed' | 'battlegrounds' | 'arena';
	readonly numberOfMembers: number;
}
