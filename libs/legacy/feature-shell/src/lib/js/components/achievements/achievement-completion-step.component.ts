import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CompletionStep } from '../../models/visual-achievement';

@Component({
	selector: 'achievement-completion-step',
	styleUrls: [`../../../css/component/achievements/achievement-completion-step.component.scss`],
	template: `
		<div
			class="completion-step"
			[ngClass]="{ completed: completedTimes > 0 }"
			[innerHTML]="svgAndTooltip"
			[helpTooltip]="tooltip"
		></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class AchievementCompletionStepComponent {
	completionStep: CompletionStep;
	completedTimes: number;
	svgAndTooltip: SafeHtml;
	tooltip: string;

	constructor(private domSanitizer: DomSanitizer) {}

	@Input() set step(step: CompletionStep) {
		console.debug('[achievement-completion-step] setting step', step.completedText, step);
		this.completionStep = step;
		this.completedTimes = step.numberOfCompletions;
		this.tooltip = step.text(true);
		this.svgAndTooltip = this.domSanitizer.bypassSecurityTrustHtml(`
			<i class="i-30">
                <svg class="svg-icon-fill">
                    <use xlink:href="assets/svg/sprite.svg#${step.icon}"/>
                </svg>
            </i>
		`);
	}
}
