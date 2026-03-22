import { Node } from './models';

export interface GameEvent {
	Type: string;
	Value?: any;
}

export class GameEventProvider {
	Timestamp: string;
	ProviderType: string;
	Creator: () => GameEvent;
	IsDamage: boolean;
	Node: Node | null;
	HighPriority: boolean;

	private constructor() {
		this.Timestamp = '';
		this.ProviderType = '';
		this.Creator = () => ({ Type: '' });
		this.IsDamage = false;
		this.Node = null;
		this.HighPriority = false;
	}

	static Create(
		timestamp: string,
		type: string,
		creator: () => GameEvent,
		isDamage: boolean,
		node: Node | null,
		highPriority: boolean = false,
	): GameEventProvider {
		const provider = new GameEventProvider();
		provider.Timestamp = timestamp;
		provider.ProviderType = type;
		provider.Creator = creator;
		provider.IsDamage = isDamage;
		provider.Node = node;
		provider.HighPriority = highPriority;
		return provider;
	}
}
