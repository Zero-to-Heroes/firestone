import { StatContext } from './context.type';
import { GlobalStatKey } from './global-stat-key.type';

export class GlobalStat {
	id: number;
	statKey: GlobalStatKey;
	value: number;
	statContext: StatContext;
}
