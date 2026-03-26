export enum NodeType {
	Action = 'Action',
	ChangeEntity = 'ChangeEntity',
	Choice = 'Choice',
	Choices = 'Choices',
	FullEntity = 'FullEntity',
	Game = 'Game',
	GameAction = 'GameAction',
	GameEntity = 'GameEntity',
	HideEntity = 'HideEntity',
	Info = 'Info',
	MetaData = 'MetaData',
	Placeholder = 'Placeholder',
	PlayerEntity = 'PlayerEntity',
	ShowEntity = 'ShowEntity',
	ShuffleDeck = 'ShuffleDeck',
	SubSpell = 'SubSpell',
	TagChange = 'TagChange',
}

export class Node {
	private static currentIndex: number = 0;

	Type: NodeType;
	Object: any;
	IndentLevel: number;
	Parent: Node | null;
	CreationLogLine: string;
	Index: number;
	Closed: boolean = false;

	constructor(type: NodeType, o: any, indentLevel: number, parent: Node | null, creationLogLine: string) {
		this.Type = type;
		this.Object = o;
		this.IndentLevel = indentLevel;
		this.Parent = parent;
		this.CreationLogLine = creationLogLine;
		if (creationLogLine == null) {
			throw new Error(`Should not create nodes with empty creationLogLine: ${type}`);
		}
		this.Index = Node.currentIndex++;
	}
}
