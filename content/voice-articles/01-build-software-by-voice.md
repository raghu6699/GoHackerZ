title: Build software by voice: a practical guide to coding with Wispr Flow
slug: build-software-by-voice-wispr-flow-guide
topic: ai-engineering
dek: You can speak most of what you would type to a coding agent, and you will probably do it faster. Here is a setup and a workflow that holds up for a full day of building.
---
Most of the time you spend with a coding agent is not spent writing code. It is spent writing sentences: what you want, what is wrong, what to change next. Those sentences are exactly what speech is good at. You can say a paragraph in the time it takes to type a line.

This guide is for developers who want to build the majority of a project by voice. It uses Wispr Flow, a dictation tool that turns what you say into clean text in whatever app your cursor is in, so the same habit works in your editor, your terminal, your browser and your agent's chat box. Check the Wispr site for current features and platform support before you rely on anything below.

## Why voice fits agent-driven development

When you write code yourself, typing is part of thinking. When you direct an agent, the work shifts to describing intent. That is closer to explaining a task to a colleague, and people explain tasks out loud all the time.

Three things get easier when you speak:

- You write longer, richer prompts, because the cost of adding another sentence drops to nearly zero.
- You think in whole requirements instead of fragments, because you can talk through a problem without stopping to edit.
- You keep your hands free to read, scroll and review the diff while you describe the next step.

## Set it up before you need it

Do this once, before the day you plan to build:

- Install Wispr Flow and sign in.
- Test it in the exact apps you will use: your editor, your terminal if your agent runs there, and the browser tab for any web-based agent.
- Choose a microphone you like. A headset with a mic beats a laptop mic, especially in a room full of other people.
- Learn the hotkey until it is automatic. If you have to think about it, you will stop using it.
- Check your plan limits. A day of heavy dictation uses far more words than casual use.

## A workflow that works

The pattern that holds up is small steps, spoken clearly, reviewed quickly.

- **State the goal** in one or two sentences. Say who the user is and what they should be able to do.
- **Give constraints.** Mention the stack, the files to leave alone, and anything that must not change.
- **Say what done looks like.** One concrete check, such as "I can add an item and see it in the list after a refresh", keeps the agent honest.
- **Let the agent work,** then read the result before you speak again.
- **Correct by describing the gap.** Say what you expected and what you got, instead of rewriting the whole request.

## What to say and what to type

Voice is for intent. Typing is still better for exact strings.

- Say: what the feature should do, how it should feel, what is wrong, what to try next.
- Type or paste: file paths, function names with unusual spelling, error messages, URLs, API keys, and anything that must be exact.

If your agent supports mentioning files, type the mention and speak around it. That one habit removes most dictation mistakes in a coding context.

## Common problems and how to handle them

- **Technical words come out wrong.** Names of libraries and tools are the usual culprits. Spell tricky ones once in the first prompt, or add them to your tool's custom dictionary if it offers one.
- **You ramble.** Rambling is fine for context but poor for instructions. After you finish talking, glance at the text and cut anything contradictory before you send it.
- **Background noise.** Use a headset, speak a little closer to the mic, and keep your voice level steady rather than louder.
- **You want to edit mid-sentence.** Pause, finish the thought, then fix the text. Fighting the tool sentence by sentence wastes time.

## A short example

Here is the kind of prompt that works well when spoken:

> I am building a small app for shop owners. They should be able to say an item and a price and see it added to today's bill, with a running total at the top. Use the existing React setup, do not change the routing, and keep the layout simple enough to use on a phone. When I add two items, I should see both and the correct total.

That is about forty seconds of speech. Typed carefully, most people would shorten it and lose the constraints. Spoken, it comes out complete.

## Keep a record as you go

If you plan to write about your build afterwards, keep notes while you work. Save a few of your real prompts, note the ones that failed and why, and screenshot your dictation stats at the end of the day. A build log written from that material is far more useful to other builders than one written from memory.

Voice will not replace reading code or thinking hard about design. It removes the typing in between, which turns out to be most of the day.
