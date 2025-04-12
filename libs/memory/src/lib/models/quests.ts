import { QuestStatus } from '@firestone-hs/reference-data';

export interface MemoryQuestsLog {
	readonly Quests: readonly MemoryQuestInfo[];
}

export interface MemoryQuestInfo {
	readonly Id: number;
	readonly Progress: number;
	readonly Status: QuestStatus;
}
export const equalMemoryQuestsLog = (
	a: MemoryQuestsLog | null | undefined,
	b: MemoryQuestsLog | null | undefined,
): boolean => {
	if (a === b) return true;
	if (!a || !b) return false;

	return (
		!!a.Quests &&
		!!b.Quests &&
		a.Quests.length === b.Quests.length &&
		a.Quests.every((quest, index) => {
			const otherQuest = b.Quests[index];
			return (
				quest.Id === otherQuest.Id &&
				quest.Progress === otherQuest.Progress &&
				quest.Status === otherQuest.Status
			);
		})
	);
};
