import { SaxesTagPlain } from 'saxes';
import { EntityDefinition } from './entity-definition';
import { EntityTag } from './entity-tag';
import { MetaData } from './metadata';
import { Option } from './option';

export interface EnrichedTag extends SaxesTagPlain {
	index?: number;
	showEntities?: EntityDefinition[];
	fullEntities?: EntityDefinition[];
	// hideEntities?: readonly number[];
	tags?: EntityTag[];
	options?: Option[];
	meta?: MetaData[];
	parentIndex?: number;
}
