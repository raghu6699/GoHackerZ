title: How to prompt a coding agent when you speak instead of type
slug: prompting-a-coding-agent-by-voice
topic: ai-engineering
dek: Spoken prompts fail in different ways from typed ones. Seven habits that keep voice-driven agent sessions productive.
---
If you have only ever typed prompts, speaking them feels odd at first. You will notice two things quickly: your prompts get longer, and some of them get worse. Length is not the problem. Unstructured length is.

These seven habits come from the way voice changes how we write instructions. They apply to any coding agent and any dictation tool.

## 1. Lead with the outcome

Start with what should be true when the agent is done. Spoken prompts tend to wander through background first and bury the request at the end, where both you and the agent can lose it.

Instead of explaining the history of the project, begin with "I want a settings page where a user can change their language and see the change immediately", then add the background.

## 2. Say constraints out loud

Constraints are the first thing you drop when typing to save effort, and the easiest thing to add when speaking. Say which files to leave alone, which libraries to use, how it should behave on a phone, and what must not break.

## 3. Name one check

End with a single verification you can run: a page that loads, a test that passes, a button that does something. It gives the agent a target and gives you a fast way to know whether to move on.

## 4. Work in short loops

Resist the urge to dictate a three-minute essay and send it. A short loop of speak, run, review, correct finds mistakes while they are still small. A good rhythm is one clear instruction every minute or two.

## 5. Correct with the gap, not a rewrite

When something is wrong, describe what you expected and what you got. "The total updates but it does not include the second item" tells the agent more than a full rewrite of the original request, and it is quicker to say.

## 6. Type the exact bits

Dictation is poor at exact strings. Paste error messages, type file names and function names, and use the agent's file mention feature. Speak the sentences around them. A hybrid approach is not cheating. It is the fast way to work.

## 7. Read before you send

Dictation tools clean up filler words, but they do not fix contradictions or a half-finished thought. Take two seconds to read the text before it goes. This is the single habit that prevents most bad voice prompts.

## A before and after

A rushed spoken prompt:

> Okay so the page is kind of slow and also the button does not work and maybe we should use a different library for the charts or something.

A better spoken version of the same thought:

> The dashboard loads slowly. First, find out why and tell me before changing anything. Separately, the export button does nothing when clicked. Fix that and show me how I can test it. Leave the charts alone for now.

The second takes about the same time to say. It has an order, a constraint and a clear next step.

## What to try next

Pick one habit and practice it for a day. Most people find that leading with the outcome and naming one check does the most for the least effort. After that, add the rest.
