import { GameType } from "../enums/game-type";
import { FormatType } from "../enums/format-type";

export class Metadata {
    readonly gameType: GameType;
    readonly formatType: FormatType;
    readonly scenarioId: number;
}