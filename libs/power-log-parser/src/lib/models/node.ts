export class Node {
	private static currentIndex: number = 0;

	Type: Function;
	Object: any;
	IndentLevel: number;
	Parent: Node | null;
	CreationLogLine: string;
	Index: number;
	Closed: boolean = false;

	constructor(type: Function, o: any, indentLevel: number, parent: Node | null, creationLogLine: string) {
		this.Type = type;
		this.Object = o;
		this.IndentLevel = indentLevel;
		this.Parent = parent;
		this.CreationLogLine = creationLogLine;
		if (creationLogLine == null) {
			throw new Error(`Should not create nodes with empty creationLogLine: ${type.name}`);
		}
		this.Index = Node.currentIndex++;
	}
}
