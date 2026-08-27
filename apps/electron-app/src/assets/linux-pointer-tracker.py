#!/usr/bin/env python3
"""Streams the X11 pointer position as "x y" lines, one per sample.

Electron's screen.getCursorScreenPoint() reports the last position the *application* saw in an
event, so a click-through overlay -- which by construction receives no pointer events -- reads a
frozen coordinate forever. XQueryPointer asks the X server directly and is unaffected.

Exits quietly if python-xlib or the display is unavailable; the caller falls back to Electron's
value in that case.
"""
import sys
import time

try:
    from Xlib import display
except ImportError:
    sys.stderr.write('python-xlib not installed\n')
    sys.exit(1)

try:
    dsp = display.Display()
except Exception as e:  # no DISPLAY, or connection refused
    sys.stderr.write('cannot open display: %s\n' % e)
    sys.exit(1)

root = dsp.screen().root
interval = 0.03
last = None

while True:
    try:
        p = root.query_pointer()
    except Exception as e:
        sys.stderr.write('query_pointer failed: %s\n' % e)
        sys.exit(1)
    # Bit 8 of the mask is Button1. The button state has to come from the server too: a flag kept
    # in the overlay page can latch on forever if the button is released while the window happens
    # to be click-through, which leaves the overlay grabbing every click and the game unplayable.
    buttons = 1 if (p.mask & 0x100) else 0
    current = (p.root_x, p.root_y, buttons)
    # Only emit on change: the reader just needs the latest known state.
    if current != last:
        last = current
        sys.stdout.write('%d %d %d\n' % current)
        sys.stdout.flush()
    time.sleep(interval)
