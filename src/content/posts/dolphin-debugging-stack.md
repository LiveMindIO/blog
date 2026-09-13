---
layout: ../../layouts/PostLayout.astro
title: "A debugger stack for a game that shipped in 2001"
description: "How decompiled Melee source, our Dolphin fork, DAP clients, and MCP make source-level debugging possible."
published: "2026-09-12T11:00:00-04:00"
number: "002"
readingTime: "10 minutes"
---

After years of work, the [`doldecomp/melee`](https://github.com/doldecomp/melee) community has finished decompiling *Super Smash Bros. Melee*. That is an enormous milestone: the game's original machine code has been reconstructed as source code that people can read, build, and study.

Finishing the decompilation does not mean there is nothing left to discover. There are still functions with placeholder names, structures that are not fully understood, and systems whose behavior needs to be tested while the game is running. A matching decompilation gives that reverse-engineering work a remarkable foundation. The next challenge is making it easier for more people to explore.

The decompilation effort helped make Super Slop Bots possible. We built on the source and knowledge its contributors recovered, and now we want to provide tools that can help push the effort further.

## So, What next?

We need people to look at the code and figure out what all of it means. One way to do that is to just look at the code,
look at what else is already understood, and then infer the function of a currently poorly understood piece of code,
then give it names.  This works great and is what I've seen called "Sudoku style" reverse engineering by Melee decomp contributor Mark McCaskey.

However, sometimes this isn't enough. Sometimes things are surrounded by completely unknown functionality and the only
way to figure it out is to run the game and look at the memory.  Mainline Dolphin's built-in debugging tools are great
for this, especially when combined with a symbol map that you can get out of mwcc, but it's not quite at the level of
modern debugging tools.

So we here at LiveMindIO have worked to add full ELF file support to our fork of dolphin, and build a DAP debugger
server in to it. This lets someone open a source file, stop Melee on a line, and see the game's global state, variables local to the current function, PowerPC registers, and the call stack showing how execution reached that line. All data displayed is structured according to the hard-won structure definitions that the Melee decompilation team divined from the binary so far. 

## Debugging with dolphins and ELFs

To get moving with debugging a game from 2001 like it's 2026, you need 3 things.  A dap server, a dap client, and an elf.  

DAP, or the Debug Adapter Protocol, is a common language between an editor and a debugger. It is what allows the same Dolphin debugger to work with different editors and tools.

The DAP Server has insight in to a running program, and lets DAP Clients ask it things, or tell it to do things to it.
For our usecase, this is [our custom Dolphin fork](https://github.com/LiveMindIO/dolphin-dap).

The DAP Client talks to the dap server, telling the DAP Server to pause/resume execution, monitor memory regions, set
breakpoints, etc;  It's what an engineer is interacting with when they're actively debugging something.  We currently
have three dolphin-dap clients. One for [VS Code](https://github.com/LiveMindIO/dolphin-dap-vscode), one for [neovim](https://github.com/LiveMindIO/dolphin-dap-nvim), and one for [LLMs in the form of an MCP server](https://github.com/LiveMindIO/dolphin-dap-mcp).

The ELF file gets produced by the compiler when we build [melee](https://github.com/doldecomp/melee) from source. It contains the program itself as well as a
bunch of metadata. Structure definitions, information about what binary code is associated with what lines in the
source, the names of global and local variables, etc;  

Prior to the completed decompilation, we could not get our hands on an elf file good enough that would allow us to do this. Congratulations to the Melee decompilation project on how far it has come, and thank you to every [`doldecomp/melee` contributor](https://github.com/doldecomp/melee/graphs/contributors). This next step depends wholly on their work.

## Dolphin DAP 

The DAP server lives beside Dolphin's PowerPC debugger, where it can directly inspect emulated execution, memory, symbols, and source information.

It supports the debugging tools people expect:

- pause, continue, restart, and step through code
- breakpoints on source lines, instructions, and memory
- call stacks and PowerPC registers
- local and global variables, structures, pointers, and arrays
- expression evaluation, memory access, source retrieval, and disassembly

It also provides game-oriented tools such as live memory watches, frozen values, memory scans, pointer-chain resolution, free-memory searches, PowerPC code injection, and detours. These are sharp tools. Reading memory observes the game; freezing, writing, injecting, or detouring changes it.

## Choose an editor

If you are unfamiliar with debugging tools, **start with VS Code** and [`dolphin-dap-vscode`](https://github.com/LiveMindIO/dolphin-dap-vscode). Its Run and Debug screen gives you visible buttons for starting, pausing, stepping, and stopping. It also shows source code, variables, the call stack, and breakpoints in one place. The repository includes working Melee `launch.json` and `tasks.json` examples that build the ELF, start Dolphin, wait for its socket, and attach the editor.

The VS Code extension is attach-only: a background task starts Dolphin, and then the extension connects to it. Keeping those steps separate makes errors easier to understand. If the build fails, you see a build error instead of a vague debugger timeout.

If you already use Neovim, [`dolphin-dap-nvim`](https://github.com/LiveMindIO/dolphin-dap-nvim) connects `nvim-dap` to Dolphin and can launch the project from the `.dolphin-dap.lua` file above. It follows normal `nvim-dap` commands and keeps optional interface plugins optional.

The two editor clients do the same basic job, but they are independent projects in independent repositories. Neither one is bundled inside the `dolphin-dap` fork.

## AI can assist, not decide

[`dolphin-dap-mcp`](https://github.com/LiveMindIO/dolphin-dap-mcp) lets an MCP client use the debugger. That means an AI agent can pause Melee, set a breakpoint, inspect a stack, read variables or memory, disassemble code, and gather evidence about what the game is doing.

This can help an agent test a guess instead of only guessing from source code. It can also repeat a long sequence of debugger operations and record what happened. That does **not** make its conclusions correct.

Nothing produced by an AI agent should be taken at face value. An AI can misread a value, confuse correlation with cause, invent a confident explanation, or modify the running game in a way that invalidates its own result. AI-generated findings need at least as much scrutiny as a human's findings, and often more. Check the source, reproduce the steps, inspect the raw debugger output, and ask whether the evidence really supports the claim.

## A working Melee setup

We tested this stack against a real debug build from [`doldecomp/melee`](https://github.com/doldecomp/melee). Here, Melee is paused at a source breakpoint in Neovim while the debugger shows the call stack, PowerPC registers, local variables, and global state beside the running game:

<img
  class="article-image"
  src="/melee-debugger-working-setup.png"
  alt="Melee paused at a source breakpoint in Neovim, with the call stack, PowerPC registers, local variables, and global state beside the Event Match screen"
  width="3072"
  height="1833"
  loading="lazy"
/>

Build the project with symbols and optimization disabled:

```sh
python3 configure.py --debug --sym on --map --no-optimize
ninja
```

This produces `build/GALE01/main.elf`. The ISO still supplies the game's disc files, but Dolphin executes the ELF so the code being run matches its debugging information.

Here is the working `.dolphin-dap.lua` shape used by `dolphin-dap-nvim` for Melee. Replace the three machine-specific paths with your own:

```lua
return {
  dolphin = "/path/to/dolphin-dap/build/Binaries/dolphin-emu-nogui",
  program = "/path/to/melee/build/GALE01/main.elf",
  disc = "/path/to/melee.iso",
  cwd = "/path/to/melee",
  source_paths = {
    "/path/to/melee/src",
    "/path/to/melee/extern/dolphin/src",
  },
  enable_cheats = false,
  port = 5678,
}
```

The order of `source_paths` matters because some old compiler records contain only a filename. The debug information must also match the exact ELF being executed. If the source, addresses, and ELF do not agree, a debugger may show the wrong line or no line at all.

We validated source lookup, a thirteen-frame call stack, registers, expressions, memory regions, scanning, pointer chains, disassembly, live watches, source breakpoints, instruction stepping, resume, and disconnect against this setup.


## Help us identify the unknowns

There is still a lot of Melee code with placeholder names, incomplete structures, or behavior that is not well understood. We need help reverse engineering it.

You do not need to be a professional programmer to begin. Start with VS Code, follow the setup examples, choose one small part of the game that interests you, and learn what happens when you pause there. A useful contribution can be as simple as confirming when a function runs, noticing that a value changes with an on-screen action, or documenting steps that somebody else can reproduce.

Pick apart the things that do not have good names yet. Record what you tried, what you observed, and what remains uncertain. A careful observation is more valuable than a clever guess.

The stack does not make a 2001 game simple, and it does not replace the decompilation effort. It connects that effort to the game while it is running. That gives more people a practical way to turn an unknown address into a source line, inspect the evidence, and help us understand Melee together.
