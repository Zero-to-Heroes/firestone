memory leaks can be caused by combining store calls + this.el.nativeElement
The reference to the native element is never cleared (why?), so the component is never collected.
Using preferencesServices$$ seems to fix the issue
