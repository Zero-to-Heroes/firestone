import { CurrentPlan, equalCurrentPlan, isActivePremiumPlan } from '@firestone/shared/framework/core';

/**
 * Returned by the subscription status providers when they could not get a definitive answer from
 * the server (eg HTTP 5xx on the status endpoint). This must NOT be treated as "no subscription":
 * callers should keep the last-known plan instead of degrading a legitimate subscriber to free.
 * Kept as a plain string so it survives the callOnMainProcess / IPC round-trip.
 */
export const SUB_STATUS_ERROR = 'error' as const;
export type SubStatusResult = CurrentPlan | null | typeof SUB_STATUS_ERROR;

/**
 * How many consecutive {@link SUB_STATUS_ERROR} fetches (while a premium plan is cached) before we
 * expire the local plan. SubscriptionService polls about once a minute while checking for updates;
 * MembershipIntegrity uses a separate longer window. This threshold is for the subscription service
 * update loop (~4 minutes of 1/min polls is too short; we only expire when an extended check loop
 * is used). Prefer MembershipIntegrity's UNVERIFIABLE_EXPIRE_THRESHOLD for the durable shield.
 * Kept here so resolveNewPlan callers can share the policy if they track consecutive errors.
 */
export const SUB_STATUS_ERROR_EXPIRE_THRESHOLD = 36;

/**
 * Decides what the current plan should become after a status fetch.
 * - On a fetch error, keep the last-known plan: transient server errors shouldn't flip a
 *   legitimate subscriber to free (and wipe the local cache), unless
 *   {@link consecutiveStatusErrors} has reached {@link SUB_STATUS_ERROR_EXPIRE_THRESHOLD} while
 *   a premium plan is cached (hosts/firewall "unverifiable forever" shield).
 * - Otherwise the fetch result is authoritative, and replaces the existing plan if it differs
 */
export const resolveNewPlan = (
	fetchResult: SubStatusResult,
	existingPlan: CurrentPlan | null,
	consecutiveStatusErrors = 0,
): { readonly plan: CurrentPlan | null; readonly shouldUpdate: boolean } => {
	if (fetchResult === SUB_STATUS_ERROR) {
		if (isActivePremiumPlan(existingPlan) && consecutiveStatusErrors >= SUB_STATUS_ERROR_EXPIRE_THRESHOLD) {
			return { plan: null, shouldUpdate: true };
		}
		return { plan: existingPlan, shouldUpdate: false };
	}
	if (equalCurrentPlan(existingPlan, fetchResult)) {
		return { plan: existingPlan, shouldUpdate: false };
	}
	return { plan: fetchResult, shouldUpdate: true };
};
