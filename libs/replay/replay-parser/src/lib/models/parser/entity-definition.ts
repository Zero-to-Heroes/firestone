import { EntityDefinitionAttribute } from './entity-definition-attribute';

export interface EntityDefinition {
	readonly id?: number;
	readonly cardID?: string;
	readonly playerID?: number;
	readonly name?: string;
	readonly tags: { [tagName: string]: number };
	readonly attributes?: EntityDefinitionAttribute;
	readonly index?: number;
	readonly parentIndex?: number;
}
