---
layout: ../../layouts/PostLayout.astro
title: "Hello, world. We make media you can change."
description: "LiveMindIO builds experimental media where the audience is part of the machinery, not a counter on the edge of the screen."
published: "2026-09-12T09:00:00-04:00"
number: "001"
readingTime: "4 minutes"
---

LiveMindIO is a business making experimental media driven by user interaction. That sentence is deliberately broad. We are interested in the territory between a broadcast, a game, a community, and a live software system: media that changes because somebody showed up and did something.

Most online video gives the audience a narrow role. Watch. React. Leave a comment that might be read later. We want the audience inside the mechanism.

## A stream where chat builds the competition

[Super Slop Bots](https://www.twitch.tv/superslopbots) is our clearest example. It is a competitive *Super Smash Bros. Melee* Twitch stream hosted by LiveMindIO, but the fighters are bots created by viewers in chat.

Viewers do not write conventional controller scripts. They describe how their fighter should behave. They can tell a bot how to approach, how to recover, which strategies to favor, and what it should do in situations that keep causing trouble. Those instructions become the raw material for a playable agent.

Creation is not the end of the process. Later evolution phases give viewers another chance to inspect what happened and revise their bot. They can call out a bad habit, preserve a behavior that worked, or suggest an entirely new response. A bot becomes a small, public design process: hypothesis, match, failure, adjustment, repeat.

The competition itself uses a recognizable Melee ruleset:

- four stocks
- eight minutes
- Final Destination
- no items

Wins and losses persist, and Elo ratings provide a longer view than any single match. The result is part tournament and part laboratory. A good instruction has consequences. So does a bad one.

## Fighters with something to say

The bots also have personalities defined by their viewers. They speak live on stream, talk to one another and to chat, and react to plays in the game and reactions from the audience. The personality is not decoration around the competition. It changes how a fighter is understood, remembered, supported, and revised.

That creates a second feedback loop. Viewers are not only shaping tactics; they are shaping characters that accumulate history in public. A recovery can become a running joke. A rivalry can outlive the match that started it. Technical behavior and social behavior meet in the same broadcast.

> The audience should be able to change what happens next, not merely choose whether to keep watching.

## Why keep field notes?

Systems like this are built from unglamorous details: chat ingestion, game-state telemetry, agent control, speech, overlays, moderation, emulation, deployment, and a long chain of failure recovery. When the experience feels immediate, it is because a lot of machinery is cooperating quickly enough to disappear.

This blog is where we will make some of that machinery visible.

We will write about experiments that worked, experiments that did not, and tools we had to build because the existing boundary was in the wrong place. Some posts will be about audience design. Others will go deep into debuggers, protocols, emulators, agents, and production infrastructure.

This is the first note from the lab. More soon.
