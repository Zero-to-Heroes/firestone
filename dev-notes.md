## Memory leaks

memory leaks can be caused by combining store calls + this.el.nativeElement
The reference to the native element is never cleared (why?), so the component is never collected.
Using preferencesServices$$ seems to fix the issue

### ng2-charts

ng2-charts (using `baseChart`) has a lot of BaseChartComponent references in the memory snapshot.
Not sure yet if this is an issue with the lib, or with how I use it, but looking at the objects in memory, it looks like there are many that are retained that I don't even use.
However, the number doesn't seem to grow (signficantly, if at all), so I guess it's all good

## Misc

ngx-color-picker doesn't work with the latest version, you need @14
