import { InjectionToken } from '@angular/core';
import { DraftSlotType } from '@firestone-hs/reference-data';
import { DeckInfoFromMemory } from '@firestone/memory';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';

export const ARENA_DRAFT_MANAGER_SERVICE_TOKEN = new InjectionToken<IArenaDraftManagerService>(
	'ArenaDraftManagerService',
);
export interface IArenaDraftManagerService {
	isReady(): Promise<void>;

	currentStep$$: SubscriberAwareBehaviorSubject<DraftSlotType | null>;
	heroOptions$$: SubscriberAwareBehaviorSubject<readonly string[] | null>;
	cardOptions$$: SubscriberAwareBehaviorSubject<readonly string[] | null>;
	currentDeck$$: SubscriberAwareBehaviorSubject<DeckInfoFromMemory | null>;
}
