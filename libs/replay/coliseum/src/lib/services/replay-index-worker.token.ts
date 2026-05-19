import { InjectionToken } from '@angular/core';
import { ReplayIndex } from '@firestone/replay/replay-parser';

/** Host app must provide this (with a Web Worker compiled into the app bundle). */
export interface ReplayIndexWorker {
	buildFullIndexInWorker(xml: string): Promise<ReplayIndex | null>;
}

export const REPLAY_INDEX_WORKER = new InjectionToken<ReplayIndexWorker>('REPLAY_INDEX_WORKER');
