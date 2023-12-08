import { QuestStatus } from '@firestone-hs/reference-data';

export interface MemoryQuestsLog {
	readonly Quests: readonly MemoryQuestInfo[];
}

export interface MemoryQuestInfo {
	readonly Id: number;
	readonly Progress: number;
	readonly Status: QuestStatus;
}
