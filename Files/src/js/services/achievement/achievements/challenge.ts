import { Achievement } from '../../../models/achievement';
import { GameEvent } from '../../../models/game-event';

export interface Challenge {

	detect(gameEvent: GameEvent, callback: Function);

	achieve(): Achievement;
}
