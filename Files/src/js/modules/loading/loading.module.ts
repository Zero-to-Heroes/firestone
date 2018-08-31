import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { SharedModule } from '../shared/shared.module';

import { LoadingComponent } from '../../components/loading/loading.component';

import { DebugService } from '../../services/debug.service';

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
        BrowserAnimationsModule,
		SharedModule,
	],
	declarations: [
		LoadingComponent,
	],
	bootstrap: [
		LoadingComponent,
	],
	providers: [
		DebugService,
	],
})

export class LoadingModule { }
