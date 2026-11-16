title: How to write a build log people will actually read
slug: how-to-write-a-build-log
topic: culture
dek: A build log is the story of how something was made, including the mistakes. A simple structure that makes yours useful to the next builder.
---
A demo shows what you built. A build log shows how. It is the part other developers learn from, and it is often the more lasting piece of work.

Most build logs fail because they read like a changelog or like marketing. A good one reads like an honest conversation with a fellow builder. Here is a structure that works.

## Start with the problem and the person

Say who you built it for and what problem they have. One short paragraph is enough. If a reader does not care about the problem, no amount of technical detail will keep them.

## Describe your setup

List the tools you used: your coding agent, the model, your editor, and any other tools in the loop. If you built by voice, say which dictation tool and how you set it up. Readers want to know what they would need to repeat your approach.

## Show real prompts

This is the section most people skip and the one readers value most. Include two or three actual prompts or dictations, exactly as you gave them. Show one that worked well and one that went wrong, and explain why.

A short example of the format:

> What I said: Add a search box that filters the list as I type, and keep it working on a phone.
> What happened: It added the box but filtered only on the first word.
> What I changed: I added "match any word in the item name" and it worked.

## Walk through the timeline

Give a rough account of how the time went. A few lines like "first hour: setup and first working screen" are enough. This shows readers where time is actually spent, which is rarely where they expect.

## Be honest about what broke

Describe the bugs, wrong turns and dead ends. They are the most useful part. A reader learns more from "the agent kept rewriting my routing until I told it to stop" than from a perfect run.

## Say what you shipped

Link to the repository and the working demo. Say what works, what does not, and what you would do next with more time. Over-claiming costs you credibility, and plain honesty earns it.

## End with tips

Finish with three to five tips for someone starting a similar project. Short, concrete and specific is better than general advice.

## A template to copy

- The problem and who it is for
- Setup: tools, models, workflow
- Real prompts: one good, one bad, with lessons
- Timeline of the build
- What broke and how you fixed it
- What shipped, with links
- Tips for the next builder

## Writing tips

- Write it soon after you finish, while the details are fresh.
- Use screenshots for anything visual.
- Keep paragraphs short and avoid jargon you would not use in conversation.
- If you dictated your build, you can dictate your build log too. Talk it through, then edit the text into shape.

The best build logs read like someone sitting next to you and showing you how they did it.
