import { StatGameFormatType } from '../stat-game-format.type';
import { StatGameModeType } from '../stat-game-mode.type';
import { GlobalStatContext } from './globa-stat-context.type';
import { GlobalStatKey } from './global-stat-key.type';

export class GlobalStat {
	key: GlobalStatKey;
	value: number;
	gameMode: StatGameModeType;
	gameFormat: StatGameFormatType;
	// More or less an equivalent of the scenario ID
	context: GlobalStatContext;
}
