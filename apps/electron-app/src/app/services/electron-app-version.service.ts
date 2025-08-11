import { IAppVersionService } from '@firestone/app/common';

export class ElectronAppVersionService implements IAppVersionService {
	async getAppVersion(): Promise<{ app: string; version: string }> {
		return { app: 'firestone-electron', version: '0.0.1' };
	}
}
