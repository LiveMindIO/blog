---
layout: ../../layouts/PostLayout.astro
title: "Debugging Melee after the matching decompilation"
description: "How Melee's matching decompilation, our Dolphin fork, DAP clients, and MCP open new paths into reverse engineering."
published: "2026-09-12T11:00:00-04:00"
updated: "2026-10-05T10:58:56-05:00"
number: "002"
readingTime: "7 minutes"
---

After years of work, the [`doldecomp/melee`](https://github.com/doldecomp/melee) community has completed a matching decompilation of *Super Smash Bros. Melee*. The reconstructed source now compiles to the original machine code. That is an enormous milestone, and it gives people a foundation for reading, building, and studying the game.

A matching decompilation is not the same as a complete understanding of the game. There are still functions with placeholder names, structures whose purpose is unclear, and systems whose behavior needs to be observed while Melee is running. Finishing the match opens the next stage of reverse engineering: explaining what all that recovered code means.

The decompilation helped make Super Slop Bots possible. We built on the source and knowledge its contributors recovered. The debugger stack in this post is our contribution back: a way for more people to connect that source to the running game, test ideas, and replace guesses with evidence.

## From matching code to understanding it

Much of reverse engineering happens by reading. You compare an unknown function with code that is already understood, follow the data moving through it, infer its role, and improve its names. Melee decompilation contributor Mark McCaskey calls this "Sudoku-style" reverse engineering: every known relationship gives you another constraint.

Sometimes the surrounding code is also unknown, or a value only makes sense in motion. Then you need to run the game and observe it. Mainline Dolphin includes useful debugging tools and can load a symbol map, but it does not provide the source-level workflow people expect from a modern editor.

Our [`dolphin-dap`](https://github.com/LiveMindIO/dolphin-dap) fork of Dolphin adds support for debugging an ELF with its DWARF information and exposes Dolphin's PowerPC debugger through the Debug Adapter Protocol. You can stop Melee on a source line and inspect local variables, global state, structures, PowerPC registers, and the call stack that led there. Those views use the types and names recovered by the Melee decompilation community.

## How the stack fits together

Source-level debugging requires three pieces:

1. **A debug ELF.** Building [`doldecomp/melee`](https://github.com/doldecomp/melee) with symbols produces an executable that contains the game and debugging metadata. That metadata connects machine-code addresses to source lines, variables, and structure definitions.
2. **A DAP server.** DAP, the Debug Adapter Protocol, is a common language between debuggers and development tools. The server built into our `dolphin-dap` fork can inspect Melee's emulated execution and answer DAP requests.
3. **A DAP client.** The client is the interface used to pause, resume, step, set breakpoints, and inspect state. We maintain separate client repositories for [VS Code](https://github.com/LiveMindIO/dolphin-dap-vscode), [Neovim](https://github.com/LiveMindIO/dolphin-dap-nvim), and [MCP clients](https://github.com/LiveMindIO/dolphin-dap-mcp). None of these clients is bundled into the `dolphin-dap` fork.

The matching decompilation is essential here. Earlier builds could provide symbols or partial source information, but the current project can produce a debug ELF in which the executed code and its debugging information agree across the game. Congratulations to the Melee decompilation project on reaching that point, and thank you to every [`doldecomp/melee` contributor](https://github.com/doldecomp/melee/graphs/contributors). This work depends on theirs.

## What Dolphin DAP can inspect

The DAP server lives beside Dolphin's PowerPC debugger, where it can inspect emulated execution, memory, symbols, and source information. It supports the tools people expect from a source debugger:

- pause, continue, restart, and step through code
- breakpoints on source lines, instructions, and memory
- call stacks and PowerPC registers
- local and global variables, structures, pointers, and arrays
- expression evaluation, memory access, source retrieval, and disassembly

It also provides game-oriented tools such as live memory watches, frozen values, memory scans, pointer-chain resolution, free-memory searches, PowerPC code injection, and detours. These are sharp tools. Reading memory observes the game; freezing, writing, injecting, or detouring changes it and can invalidate an experiment.

## Build a debuggable Melee ELF

First follow the decompilation project's [getting-started guide](https://github.com/doldecomp/melee/blob/master/docs/getting_started.md) to prepare the repository and the required files from your own copy of Melee.

Configure a debug build. `--debug` enables symbols and disables optimization for normal source builds; some files retain optimization for compatibility.

```sh
python3 configure.py --debug
ninja
```

This produces `build/GALE01/main.elf`. With executable replacement enabled below, Dolphin boots your ISO through its normal disc bootstrap, then replaces the disc executable with this ELF. That keeps the executed code aligned with its debugging information while retaining the game's disc files.

## Start with VS Code

If you are unfamiliar with debuggers, start with VS Code and our [`dolphin-dap-vscode`](https://github.com/LiveMindIO/dolphin-dap-vscode) extension. Its Run and Debug view keeps source code, variables, the call stack, and breakpoints visible alongside controls for pausing and stepping.

Build our Dolphin fork using the [`dolphin-dap` server guide](https://github.com/LiveMindIO/dolphin-dap/blob/master/Tools/dap/README.md), then follow the [VS Code extension installation instructions](https://github.com/LiveMindIO/dolphin-dap-vscode#installation).

### Managed launch on Linux or Windows

With extension version 0.3.0 or newer, add this `.vscode/launch.json` to the Melee checkout:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Melee",
      "type": "dolphin",
      "request": "launch",
      "dolphin": "/path/to/dolphin-emu-nogui",
      "program": "/path/to/melee.iso",
      "elfFile": "${workspaceFolder}/build/GALE01/main.elf",
      "replaceDiscExecutable": true,
      "sourcePaths": ["${workspaceFolder}/src", "${workspaceFolder}/libs/dolphin/src"],
      "stopOnEntry": true
    }
  ]
}
```

Replace the Dolphin and ISO paths, then select **Debug Melee** in Run and Debug. The extension starts Dolphin and connects the debugger. See the [plugin documentation](https://github.com/LiveMindIO/dolphin-dap-vscode#configuration) for platform settings and troubleshooting.

On Windows, use your built `DolphinNoGUI.exe` as `dolphin` and add `"platform": "win32"`. The JSON above uses Linux's executable name.

For a first test, open a source file from this Melee checkout and click beside an executable line number to set a breakpoint. Start **Debug Melee**, then click **Continue** from the initial startup stop. Perform the game action that reaches your breakpoint. When it stops, use **Step Over** and inspect **Variables** and **Call Stack**. Click **Stop** when finished. Startup disassembly is normal before reaching source with debug information; an unverified breakpoint may indicate a non-executable line or a mismatched ELF.

Both editor plugins enable core debugging automatically with `Dolphin.Interface.DebugModeEnabled=True`. Managed launches use TCP; manual attachment requires you to start Dolphin with core debugging enabled and a matching port or socket. A DAP endpoint alone does not enable breakpoint checks.

To build before launching, add `preLaunchTask` referencing your workspace's build task. The [build-task guide](https://github.com/LiveMindIO/dolphin-dap-vscode#build-before-launching) shows how to configure it.

## A working Neovim setup

If you already use Neovim, [`dolphin-dap-nvim`](https://github.com/LiveMindIO/dolphin-dap-nvim) connects `nvim-dap` to Dolphin and can launch the project from `.dolphin-dap.lua`. It follows the normal `nvim-dap` commands and keeps interface plugins optional.

We tested this stack against a real debug build from [`doldecomp/melee`](https://github.com/doldecomp/melee). Here, Melee is paused at a source breakpoint in Neovim while the debugger shows the call stack, PowerPC registers, local variables, and global state beside the running game:

<img
  class="article-image"
  src="/melee-debugger-working-setup.png"
  alt="Melee paused at a source breakpoint in Neovim, with the call stack, PowerPC registers, local variables, and global state beside the Event Match screen"
  width="3072"
  height="1833"
  loading="lazy"
/>

Create `.dolphin-dap.lua` in the Melee checkout using the current plugin configuration. Replace the machine-specific paths with your own:

```lua
return {
  dolphin = "/path/to/dolphin-dap/build/Binaries/dolphin-emu-nogui",
  program = "/path/to/melee.iso",
  elf_file = "/path/to/melee/build/GALE01/main.elf",
  replace_disc_executable = true,
  cwd = "/path/to/melee",
  source_paths = {
    "/path/to/melee/src",
    "/path/to/melee/libs/dolphin/src",
  },
  enable_cheats = false,
  port = 5678,
}
```

Run `:DapContinue` and select **Dolphin launch nogui (video, …)** to see the game window, or **Dolphin launch headless** for no window. The Qt launch requires the separate `dolphin-emu` binary. Source roots must match your checkout; older Melee revisions may use `extern/dolphin/src` instead of `libs/dolphin/src`. See the [Neovim plugin documentation](https://github.com/LiveMindIO/dolphin-dap-nvim#configuration) for installation, configuration options, and manual attachment.

Before launching, open a source file and run `:DapToggleBreakpoint` on an executable line. Continue past the startup stop with `:DapContinue`, then trigger that code in the game. Use `:DapStepOver` to step, inspect **Scopes** and **Stacks** with `nvim-dap-ui`, and run `:DapDisconnect` when finished. On Windows, configure `DolphinNoGUI.exe` and `platform = "win32"`; set `dolphin_gui` explicitly if using Qt.

## AI can assist, not decide

[`dolphin-dap-mcp`](https://github.com/LiveMindIO/dolphin-dap-mcp) is a separate MCP server that lets a compatible AI client use the debugger. Follow its README to install and connect it. Once connected, an agent can set a breakpoint, inspect a stack, read variables or memory, disassemble code, and gather evidence about what the game is doing.

This lets an agent test a guess instead of only reasoning from source code. It can also repeat a long sequence of debugger operations and record what happened. That does **not** make its conclusions correct.

Nothing produced by an AI agent should be taken at face value. An AI can misread a value, confuse correlation with cause, invent a confident explanation, or modify the running game in a way that invalidates its own result. AI-generated findings need at least as much scrutiny as human-generated findings, and often more. Check the source, reproduce the steps, inspect the raw debugger output, and ask whether the evidence supports the claim.

## Help identify the unknowns

You do not need to be a professional programmer to help. Choose one small part of Melee that interests you and ask a question you can observe: When does this function run? Which value changes when a character lands? Does the same path execute for every fighter?

Set a breakpoint, perform one controlled action, and record what happened. Change one condition and repeat it. Useful evidence can be as simple as confirming when a function runs, connecting a value to an on-screen action, or writing reproduction steps that somebody else can verify. A careful observation is more valuable than a clever guess.

Before renaming code or changing a structure, search the source to see what is already known. Bring questions and uncertain findings to the `#smash-bros-melee` channel in the [GameCube/Wii Decompilation Discord](https://discord.gg/hKx3FJJgrV), where contributors coordinate this kind of investigation. When the evidence is ready for a code contribution, follow the project's [contributing guidelines](https://github.com/doldecomp/melee/blob/master/.github/CONTRIBUTING.md). Include the source location, build revision, breakpoint or address, exact steps, observations, and anything that remains uncertain so another contributor can reproduce your work.
