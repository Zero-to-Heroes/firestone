import { NGXLogger, NGXLoggerMock } from 'ngx-logger';
import { Achievement } from '../../models/achievement';
import { ReplayInfo } from '../../models/replay-info';
import { AchievementRecordingService } from './achievement-recording.service';
import { AchievementsLoaderService } from './data/achievements-loader.service';

describe('Achievement Recording Service', () => {
	const logger = () => new NGXLoggerMock() as NGXLogger;
	const loader = achievements =>
		({
			getAchievements: async () => {
				return new Promise<readonly Achievement[]>(resolve => {
					resolve(achievements);
				});
			},
		} as AchievementsLoaderService);
	const baseAchievementLow = {
		id: 'dungeon_run_boss_encounter_LOOTA_BOSS_44h',
		name: 'Fake Wee Whelp',
		text: 'Temp text',
		type: 'dungeon_run_boss_encounter_LOOTA_BOSS_44h',
		displayCardId: 'LOOTA_BOSS_44h',
		displayCardType: 'minion',
		displayName: 'Boss met: Fake Wee Whelp',
		difficulty: 'common',
		icon: 'boss_encounter',
		maxNumberOfRecords: 2,
		points: 1,
		numberOfCompletions: 0,
		replayInfo: [],
		root: null,
		priority: 0,
		emptyText: null,
		completedText: null,
	};
	const baseAchievementHigh = {
		id: 'dungeon_run_boss_encounter_LOOTA_BOSS_44h',
		name: 'Fake Wee Whelp',
		text: 'Temp text',
		type: 'dungeon_run_boss_encounter_LOOTA_BOSS_44h',
		displayCardId: 'LOOTA_BOSS_44h',
		displayCardType: 'minion',
		displayName: 'Boss met: Fake Wee Whelp',
		difficulty: 'common',
		icon: 'boss_encounter',
		maxNumberOfRecords: 2,
		points: 1,
		numberOfCompletions: 0,
		replayInfo: [],
		root: null,
		priority: 1,
		emptyText: null,
		completedText: null,
	};

	describe('single step in achievement', () => {
		test('achievement should be recorded if it has never been recorded', async () => {
			const refAchievement = Object.assign(new Achievement(), baseAchievementLow);
			const achievement: Achievement = Object.assign(new Achievement(), refAchievement);
			const achievements: readonly Achievement[] = [refAchievement];
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBe(true);
		});

		test('achievement should be recorded if it has been recorded fewer times than max number of records', async () => {
			const refAchievement = Object.assign(new Achievement(), baseAchievementLow);
			const achievement: Achievement = Object.assign(new Achievement(), refAchievement, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievement];
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBe(true);
		});

		test('achievement should not be recorded if it has already been recorded exactly max number of records', async () => {
			const refAchievement = Object.assign(new Achievement(), baseAchievementLow);
			const achievement: Achievement = Object.assign(new Achievement(), refAchievement, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievement];
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBeFalsy();
		});

		test('achievement should not be recorded if it has already been recorded more than max number of records', async () => {
			const refAchievement = Object.assign(new Achievement(), baseAchievementLow);
			const achievement: Achievement = Object.assign(new Achievement(), refAchievement, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievement];
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBeFalsy();
		});
	});

	describe('highest step of a multiple step achievement', () => {
		test('achievement should be recorded if it has never been recorded', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementHigh);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBe(true);
		});

		test('achievement should be recorded if it has been recorded fewer times than max number of records', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementHigh, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBe(true);
		});

		test('achievement should not be recorded if it has already been recorded exactly max number of records', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementHigh, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBeFalsy();
		});

		test('achievement should not be recorded if it has already been recorded more than max number of records', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementHigh, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBeFalsy();
		});
	});

	describe('not-highest step of a multiple step achievement where highest step has never been completed', () => {
		test('achievement should be recorded if it has never been recorded', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh, {
				numberOfCompletions: 0,
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementLow);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBe(true);
		});

		test('achievement should be recorded if it has been recorded fewer times than max number of records', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh, {
				numberOfCompletions: 0,
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementLow, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBe(true);
		});

		test('achievement should not be recorded if it has already been recorded exactly max number of records', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh, {
				numberOfCompletions: 0,
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementLow, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBeFalsy();
		});

		test('achievement should not be recorded if it has already been recorded more than max number of records', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh, {
				numberOfCompletions: 0,
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementLow, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBeFalsy();
		});
	});

	describe('not-highest step of a multiple step achievement where highest step has already been completed', () => {
		test('achievement should be not recorded even if it has never been recorded', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh, {
				numberOfCompletions: 1,
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementLow);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBeFalsy();
		});

		test('achievement should be not recorded even if it has been recorded fewer times than max number of records', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh, {
				numberOfCompletions: 1,
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementLow, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBeFalsy();
		});

		test('achievement should not be recorded even if it has already been recorded exactly max number of records', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh, {
				numberOfCompletions: 1,
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementLow, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBeFalsy();
		});

		test('achievement should not be recorded if it has already been recorded more than max number of records', async () => {
			const refAchievementLow = Object.assign(new Achievement(), baseAchievementLow);
			const refAchievementHigh = Object.assign(new Achievement(), baseAchievementHigh, {
				numberOfCompletions: 1,
			} as Achievement);
			const achievements: readonly Achievement[] = [refAchievementLow, refAchievementHigh];
			const achievement: Achievement = Object.assign(new Achievement(), refAchievementLow, {
				replayInfo: [
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
					{
						completionStepId: baseAchievementLow.id,
					} as ReplayInfo,
				] as readonly ReplayInfo[],
			} as Achievement);
			const service = new AchievementRecordingService(logger(), loader(achievements));

			const shouldRecord = await service.shouldRecord(achievement);

			expect(shouldRecord).toBeFalsy();
		});
	});
});
