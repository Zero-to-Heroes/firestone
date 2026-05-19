import { GameType } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import {
	buildReplayTimeline,
	computeTimelineTotalDuration,
	getBattlegroundsDisplayTurnNumber,
	TimelineGame,
} from './replay-timeline.builder';

describe('replay-timeline.builder', () => {
	const createConstructedGame = (): TimelineGame => {
		const player = { playerId: 1, name: 'Alice' };
		const opponent = { playerId: 2, name: 'Bob' };
		return {
			gameType: 1,
			players: [player, opponent],
			turns: Map([
				[0, { actions: [{ timestamp: 0, activePlayer: 1, textRaw: 'Mulligan' }] }],
				[1, { actions: [{ timestamp: 1000, activePlayer: 1, textRaw: 'Start' }] }],
				[2, { actions: [{ timestamp: 5000, activePlayer: 2, textRaw: 'Start' }] }],
			]),
		};
	};

	const createBattlegroundsGame = (): TimelineGame => ({
		gameType: GameType.GT_BATTLEGROUNDS as number,
		players: [{ playerId: 1, name: 'Player' }],
		turns: Map([
			[0, { actions: [{ timestamp: 0, textRaw: 'Hero' }] }],
			[2, { actions: [{ timestamp: 2000, newState: 1, textRaw: 'Recruit' }] }],
			[3, { actions: [{ timestamp: 8000, newState: 2, textRaw: 'Combat' }] }],
		]),
	});

	it('builds constructed markers with alternating player turns', () => {
		const timeline = buildReplayTimeline(createConstructedGame(), 10000);

		expect(timeline.markers.length).toBe(3);
		expect(timeline.markers[0].kind).toBe('mulligan');
		expect(timeline.markers[1].kind).toBe('player_turn');
		expect(timeline.markers[1].isLocalPlayer).toBe(true);
		expect(timeline.markers[2].isLocalPlayer).toBe(false);
		expect(timeline.markers[1].label).toContain('Alice');
		expect(timeline.markers[2].label).toContain('Bob');
	});

	it('builds monotonic segment percents', () => {
		const timeline = buildReplayTimeline(createConstructedGame(), 10000);

		expect(timeline.segments.length).toBeGreaterThan(0);
		for (const segment of timeline.segments) {
			expect(segment.endPercent).toBeGreaterThan(segment.startPercent);
		}
	});

	it('builds battlegrounds recruit and combat markers', () => {
		const timeline = buildReplayTimeline(createBattlegroundsGame(), 10000);

		expect(timeline.markers.some((m) => m.kind === 'hero_selection')).toBe(true);
		expect(timeline.markers.some((m) => m.kind === 'bg_recruit')).toBe(true);
		expect(timeline.markers.some((m) => m.kind === 'bg_combat')).toBe(true);
	});

	it('applies battlegrounds display turn hack for combat on turn 3', () => {
		expect(getBattlegroundsDisplayTurnNumber(3, 2)).toBe(1);
	});

	it('computes total duration from last action timestamp', () => {
		expect(computeTimelineTotalDuration(createConstructedGame())).toBe(5000);
	});
});
