import { CurrentPlan, PremiumPlanId } from '@firestone/shared/framework/core';

export interface OwDetailedSubscriptionPlan {
	readonly planId: number;
	readonly state: string;
	readonly expiryDate?: number | string | null;
}

const isOwLegacyPlanStillActive = (plan: OwDetailedSubscriptionPlan): boolean => {
	if (plan.state === 'revoked') {
		return false;
	}
	if (plan.state === 'active') {
		return true;
	}
	if (plan.state === 'cancelled') {
		const expireAt = plan.expiryDate != null ? new Date(plan.expiryDate) : null;
		return expireAt != null && expireAt >= new Date();
	}
	return false;
};

export const buildLegacyPlanFromOwDetailedPlan = (plan: OwDetailedSubscriptionPlan): CurrentPlan | null => {
	if (!isOwLegacyPlanStillActive(plan)) {
		return null;
	}
	return {
		id: 'legacy' as PremiumPlanId,
		expireAt: plan.expiryDate != null ? new Date(plan.expiryDate) : null,
		active: true,
		autoRenews: plan.state === 'active',
		cancelled: plan.state === 'cancelled',
	};
};
