import { Injectable, Injector } from '@angular/core';
import { BootstrapEssentialServicesService } from './bootstrap-essential-services.service';
import { AppStartupService } from './app-startup.service';
import { BootstrapOtherServicesService } from './bootstrap-other-services.service';
import { BootstrapStoreServicesService } from './bootstrap-store-services.service';

@Injectable()
export class AppBootstrapService {
	constructor(private readonly injector: Injector) {}

	public async init() {
		console.log('[bootstrap] starting essential services');
		await this.injector.get(BootstrapEssentialServicesService).bootstrapServices();
		// Use injector to make sure that no other constructors are called until everything is ready to go
		// At this point, the essential services that all the apps rely on should be ready.
		console.log('[bootstrap] essential services are ready, starting up store');
		await this.injector.get(BootstrapStoreServicesService).bootstrapServices();
		console.log('[bootstrap] store is ready, starting up other services');
		await this.injector.get(BootstrapOtherServicesService).bootstrapServices();
		console.log('[bootstrap] all services are ready, starting up the app');
		await this.injector.get(AppStartupService).init();
	}
}
