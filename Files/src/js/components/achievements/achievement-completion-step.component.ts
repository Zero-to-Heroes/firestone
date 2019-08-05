import { Component, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CompletionStep } from '../../models/visual-achievement';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';

@Component({
	selector: 'achievement-completion-step',
	styleUrls: [`../../../css/component/achievements/achievement-completion-step.component.scss`],
	template: `
		<div class="completion-step" [ngClass]="{ 'completed': completedTimes > 0 }" [innerHTML]="svgAndTooltip"></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class AchievementCompletionStepComponent {
	completionStep: CompletionStep;
	completedTimes: number;
	svgAndTooltip: SafeHtml;

	constructor(private domSanitizer: DomSanitizer) {}

	@Input() set step(step: CompletionStep) {
		this.completionStep = step;
		this.completedTimes = step.numberOfCompletions;
		this.svgAndTooltip = this.domSanitizer.bypassSecurityTrustHtml(`
			<i class="i-30">
                <svg class="svg-icon-fill">
                    <use xlink:href="/Files/assets/svg/sprite.svg#${step.iconSvgSymbol}"/>
                </svg>
            </i>
            <div class="zth-tooltip bottom">
                <p>${step.text(true)}</p>
                <svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
                    <polygon points="0,0 8,-9 16,0"/>
                </svg>
            </div>
		`);
	}
}
