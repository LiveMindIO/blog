---
layout: ../../layouts/PostLayout.astro
title: "A debugger stack for a game that shipped in 2001"
description: "How Dolphin DAP, MCP, VS Code, and Neovim turn an emulated PowerPC game into a source-level debugging environment."
published: "2026-09-12T11:00:00-04:00"
number: "002"
readingTime: "9 minutes"
---

Super Slop Bots runs on top of *Super Smash Bros. Melee*, a GameCube game released in 2001. Building new systems around an old game eventually means answering a very modern question: can we put a breakpoint here?

For us, the answer needed to be better than an emulator pause button and a list of PowerPC instructions. We wanted source files, line breakpoints, call stacks, local variables, structured values, memory tools, and editor integrations. We also wanted automation to use the same debugger without inventing a second control plane.

The result is a small stack built around the Debug Adapter Protocol:

```text
VS Code ─── stdio proxy ──┐
Neovim / nvim-dap ───────┼── DAP over TCP or Unix socket ── Dolphin
MCP client ── MCP server ┘
```

There are four names in the stack, but only two repositories. [`dolphin-dap`](https://github.com/LiveMindIO/dolphin-dap) contains the emulator-side DAP server and the bundled editor integrations. [`dolphin-dap-mcp`](https://github.com/LiveMindIO/dolphin-dap-mcp) is a separate TypeScript service that presents the debugger to MCP clients.

## Layer one: Dolphin is the debug adapter

The important architectural decision is that Dolphin itself speaks DAP. There is no GDB or LLDB process translating from another debugger protocol. The adapter lives beside Dolphin's PowerPC debugger and has direct access to emulated execution, memory, symbols, and source metadata.

The server uses normal `Content-Length` framed DAP over loopback TCP or a Unix-domain socket. A minimal launch looks like this:

```sh
dolphin-emu-nogui \
  -C Dolphin.General.DAPPort=5678 \
  -C Dolphin.Core.DefaultISO=/path/to/game.iso \
  -C Dolphin.Core.BootExecutableWithDefaultDisc=true \
  --exec /path/to/main.elf
```

Executing an ELF matters. A decompilation project can produce a symbol-rich build whose addresses correspond to the running game. Dolphin can then turn an instruction address into a source path and line, and it can interpret the CodeWarrior-era DWARF 1.1 data emitted for GameCube software.

The standard debugger surface includes:

- pause, continue, restart, and source or instruction stepping
- source, instruction, and ranged data breakpoints
- PowerPC call stacks and registers
- local and global variables, structures, pointers, and arrays
- expression evaluation, memory access, source retrieval, and disassembly

We added game-oriented operations as well: realtime memory watches, frozen values, typed and raw memory scans, pointer-chain resolution, free-memory searches, PowerPC code injection, and transparent detours. These are sharp tools. A read is observation; a freeze, write, or detour changes the live machine.

## Layer two: Dolphin DAP MCP

Editor debugging is useful when a person knows where to look. Automation needs a durable connection, explicit operations, and a way to wait for asynchronous state changes. [`dolphin-dap-mcp`](https://github.com/LiveMindIO/dolphin-dap-mcp) provides that layer.

It is an MCP server written in TypeScript. Upstream, it speaks MCP over stdio. Downstream, it keeps one persistent DAP connection to Dolphin over TCP or a Unix socket. It correlates replies by request sequence, queues events, and exposes sixteen tools covering lifecycle, execution, breakpoints, stacks, variables, memory, disassembly, sources, watches, scans, injection, detours, and pointer chains. A raw request tool keeps new Dolphin extensions usable before the MCP layer grows a dedicated wrapper.

The server can attach to an existing emulator or launch one itself:

```json
{
  "executable": "/path/to/dolphin-emu-nogui",
  "elf": "/project/build/main.elf",
  "disc": "/path/to/game.iso",
  "port": 5678,
  "sourcePaths": [
    "/project/src",
    "/project/extern/dolphin/src"
  ],
  "stopOnEntry": true
}
```

We validated the whole path against a live Melee debug build: source resolution, source retrieval, a thirteen-frame stack, registers, expression evaluation, memory regions, a bounded scan, a pointer chain, PowerPC disassembly, a realtime watch, a real source breakpoint, instruction stepping, resume, and a clean disconnect.

The goal is not to let an automated client poke memory indiscriminately. The goal is to let it gather the same evidence a careful debugger user would gather, through operations whose effects are visible and bounded.

## Layer three: the VS Code client

The bundled [Dolphin DAP Client for VS Code](https://github.com/LiveMindIO/dolphin-dap/tree/master/Tools/dap/vscode) registers a `dolphin` debugger type and connects the editor to the emulator. A small Node proxy carries framed DAP between VS Code's stdio adapter interface and Dolphin's TCP or socket transport.

Its less visible job is source-path repair. Old compiler metadata does not always contain the absolute path of today's checkout. The client can resolve relative and basename-only paths against configured source roots, while deliberately refusing ambiguous matches rather than opening the wrong file.

The extension is attach-only. In practice, a VS Code background task builds the project, starts Dolphin, waits for the DAP socket, and then allows the debug configuration to attach. Keeping launch and attachment separate makes failures easier to see: a broken build never becomes a mysterious debugger timeout.

## Layer four: the Neovim client

The bundled [Neovim integration](https://github.com/LiveMindIO/dolphin-dap/tree/master/Tools/dap/nvim) connects `nvim-dap` directly to Dolphin. The minimal form is a normal server or pipe attachment. The included `dolphin-dap` Lua module adds project discovery and generated launch configurations.

A project can describe its Dolphin executable, ELF, disc, working directory, source roots, and port in `.dolphin-dap.lua`. From that one file, the integration can generate headless or graphical launches as well as attach configurations. It also supports sidecar ELF workflows, provided the metadata addresses match the running executable exactly.

This client stays close to the conventions of `nvim-dap`. There is no second debugger model to learn, and optional UI packages remain optional.

## One protocol, shared state

Using DAP at every boundary gives us interchangeable views of the same running system. VS Code can provide a familiar graphical debugger. Neovim can keep debugging next to the code and command line. MCP can collect evidence, run repeatable inspections, and expose emulator-specific tools to automation.

They are not isolated sessions. Dolphin allows at most two DAP clients, and execution state and breakpoint domains are shared. In normal use, one active client is the safest choice. Optimized code can still make source stepping and local variables imperfect. Debug metadata is useful only when it describes the executable actually running.

Those constraints are worth stating because the stack is not pretending that a 2001 toolchain behaves like a current native build. It is translating the real machine faithfully enough that we can investigate it with modern habits.

For an interactive media system, that changes the speed of understanding. A failure no longer ends at “the emulator did something strange.” It can end at a source line, with a stack, values, memory, and a reproducible path back to the cause.
