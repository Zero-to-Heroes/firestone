/** Re-exports — canonical implementation lives in `@firestone/power-log-parser`. */
export {
	findCreateGameLineIndices,
	findCreateGameLineIndicesGameState,
	findCreateGameLineIndicesPowerTaskList,
	findLastGameStartLineIndex,
	POWER_LOG_CREATE_GAME_MARKER,
	trimPowerLogFileContentToLastGame,
	trimPowerLogLinesToLastGame,
} from '@firestone/power-log-parser';
