import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { InlineSVGModule } from 'ng-inline-svg-2';

import { routes } from './routes';

export const appConfig: ApplicationConfig = {
	providers: [provideRouter(routes), provideHttpClient(), importProvidersFrom(InlineSVGModule.forRoot())],
};
