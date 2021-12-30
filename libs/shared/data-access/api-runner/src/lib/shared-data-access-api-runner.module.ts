import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApiRunner } from './api-runner';

@NgModule({
	imports: [CommonModule, HttpClientModule],
	providers: [ApiRunner],
})
export class SharedDataAccessApiRunnerModule {}
