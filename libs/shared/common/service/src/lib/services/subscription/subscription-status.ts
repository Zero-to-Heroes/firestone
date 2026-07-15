import { CurrentPlan, equalCurrentPlan } from '@firestone/shared/framework/core';

/**
 * Returned by the subscription status providers when they could not get a definitive answer from
 * the server (eg HTTP 5xx on the status endpoint). This must NOT be treated as "no subscription":
 * callers should keep the last-known plan instead of degrading a legitimate subscriber to free.
 * Kept as a plain string so it survives the callOnMainProcess / IPC round-trip.
 */
export const SUB_STATUS_ERROR = 'error' as const;
export type SubStatusResult = CurrentPlan | null | typeof SUB_STATUS_ERROR;

/**
 * Decides what the current plan should become after a status fetch.
 * - On a fetch error, keep the last-known plan: transient server errors shouldn't flip a
 *   legitimate subscriber to free (and wipe the local cache)
 * - Otherwise the fetch result is authoritative, and replaces the existing plan if it differs
 */
export const resolveNewPlan = (
	fetchResult: SubStatusResult,
	existingPlan: CurrentPlan | null,
): { readonly plan: CurrentPlan | null; readonly shouldUpdate: boolean } => {
	if (fetchResult === SUB_STATUS_ERROR) {
		return { plan: existingPlan, shouldUpdate: false };
	}
	if (equalCurrentPlan(existingPlan, fetchResult)) {
		return { plan: existingPlan, shouldUpdate: false };
	}
	return { plan: fetchResult, shouldUpdate: true };
};
