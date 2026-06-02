import { IAppVersionService } from '@firestone/app/common';
import { environment } from '../../environments/environment';

export class ElectronAppVersionService implements IAppVersionService {
	async getAppVersion(): Promise<{ app: string; version: string }> {
		return { app: 'firestone-electron', version: environment.version };
	}
}
