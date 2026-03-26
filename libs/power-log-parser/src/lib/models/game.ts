import { Action } from './action';
import { GameData } from './game-data';

export class Game {
	TimeStamp: string = '';
	BuildNumber: number = 0;
	Type: number = 0;
	GameType: number = -1;
	FormatType: number = -1;
	ScenarioID: number = 0;
	GameSeed: number = 0;
	Data: GameData[] = [];

	AddData(data: GameData): void {
		this.Data.push(data);
	}

	FilterGameData(...types: (new (...args: any[]) => GameData)[]): GameData[] {
		const result: GameData[] = [];
		for (const data of this.Data) {
			result.push(data);
			this.ExtractData(result, data);
		}
		if (types.length === 0) {
			return result;
		}
		return result.filter((data) => types.some((t) => data instanceof t));
	}

	ExtractData(result: GameData[], data: GameData): void {
		if (data instanceof Action) {
			for (const gameData of data.Data) {
				result.push(gameData);
				if (data !== gameData) {
					gameData.InternalParent = data;
				}
				this.ExtractData(result, gameData);
			}
		}
	}

	GetLastAction(predicate: (action: Action) => boolean): Action | null {
		return this.GetLastActionInternal(this.Data, predicate);
	}

	private GetLastActionInternal(data: GameData[], predicate: (action: Action) => boolean): Action | null {
		for (let i = data.length - 1; i >= 0; i--) {
			if (!(data[i] instanceof Action)) {
				continue;
			}
			const action = data[i] as Action;
			const childMatch = this.GetLastActionInternal(action.Data, predicate);
			if (childMatch != null) {
				return childMatch;
			}
			if (predicate(action)) {
				return action;
			}
		}
		return null;
	}
}

export class HearthstoneReplay {
	Build: string = '';
	Version: string = '';
	Games: Game[] = [];
}
