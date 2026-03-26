import { GameData } from './game-data';

export abstract class GameAction extends GameData {
	Entity: number = 0;
}
