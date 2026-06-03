import { InjectionToken } from '@angular/core';
import { BnetRegion } from '@firestone-hs/reference-data';

/**
 * Subset of account/main-window account wiring used outside `@firestone/profile/common`
 * without importing ProfileCommon (avoids Nx circular libs: profile → collection → profile).
 * Implemented by {@link AccountService} from `@firestone/profile/common`.
 */
export interface IAccountFacadeForCollection {
	isReady(): Promise<void>;
	getRegion(): Promise<BnetRegion | null>;
	getAccountInfo(): Promise<{ BattleTag?: string } | null>;
	interfaceLoginButton(): Promise<void>;
}

export const ACCOUNT_SERVICE_TOKEN = new InjectionToken<IAccountFacadeForCollection>('ACCOUNT_SERVICE');
