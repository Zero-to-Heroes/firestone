import { StatContext } from './context.type';
import { GlobalStatKey } from './global-stat-key.type';

export class GlobalStat {
	key: GlobalStatKey;
	value: number;
	context: StatContext;
}
