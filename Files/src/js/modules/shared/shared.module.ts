import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { VersionComponent }  from '../../components/version.component';

@NgModule({
	imports: [
	],
	declarations: [
		VersionComponent,
	],
	exports: [
		VersionComponent,
	],
})

export class SharedModule { }
