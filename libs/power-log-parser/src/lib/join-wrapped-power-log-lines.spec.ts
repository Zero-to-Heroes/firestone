import {
	hasUnclosedSquareBrackets,
	joinWrappedPowerLogLines,
	shouldJoinWrappedPowerLogLine,
} from './join-wrapped-power-log-lines';

describe('joinWrappedPowerLogLines', () => {
	it('joins entityName continuations that omit the D prefix', () => {
		const lines = [
			'D 13:26:34.5111776 GameState.DebugPrintEntityChoices() -   Source=[entityName=Чары игрока:',
			'карта горы id=106 zone=PLAY zonePos=0 cardId=TLC_464e player=1]',
			'D 13:26:34.5111776 GameState.DebugPrintEntityChoices() -   Entities[0]=[entityName=Жуткий корсар id=99 zone=SETASIDE zonePos=0 cardId=CORE_NEW1_022 player=1]',
		];
		expect(joinWrappedPowerLogLines(lines)).toEqual([
			'D 13:26:34.5111776 GameState.DebugPrintEntityChoices() -   Source=[entityName=Чары игрока: карта горы id=106 zone=PLAY zonePos=0 cardId=TLC_464e player=1]',
			'D 13:26:34.5111776 GameState.DebugPrintEntityChoices() -   Entities[0]=[entityName=Жуткий корсар id=99 zone=SETASIDE zonePos=0 cardId=CORE_NEW1_022 player=1]',
		]);
	});

	it('does not join a new log line after a complete entity', () => {
		const previous =
			'D 13:26:34.5111776 GameState.DebugPrintEntityChoices() -   Entities[0]=[entityName=Жуткий корсар id=99 zone=SETASIDE zonePos=0 cardId=CORE_NEW1_022 player=1]';
		const next =
			'D 13:26:34.5111776 GameState.DebugPrintEntityChoices() -   Entities[1]=[entityName=Эксперимент id=104 zone=SETASIDE zonePos=0 cardId=DINO_435 player=1]';
		expect(shouldJoinWrappedPowerLogLine(previous, next)).toBe(false);
	});

	it('tracks nested brackets inside entityName', () => {
		const line =
			'D 13:00:00.0000000 GameState.DebugPrintPower() - TAG_CHANGE Entity=[entityName=UNKNOWN ENTITY [cardType=INVALID] id=28 zone=DECK zonePos=0 cardId= player=1] tag=ZONE value=HAND';
		expect(hasUnclosedSquareBrackets(line)).toBe(false);
		expect(
			hasUnclosedSquareBrackets(
				'D 13:00:00.0000000 GameState.DebugPrintPower() - TAG_CHANGE Entity=[entityName=Чары игрока:',
			),
		).toBe(true);
	});
});
