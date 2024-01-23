# Overview

This document should outline the design strategies and guidelines for the bot.

The bot intends to implement a primarily data-oriented style, with some aspects of functional, imparative and object oriented design.

# Data/functional structures

## Utils
- a static class
- does not contain any state
- contains functions/methods

Utils stands for utilities. These are functions that will generally take inputs and provide information in return.

### Example

CommuneUtils contains utility functions that provide often cached information on call that helps with processing

## Procs
- a static class
- does not contain any state
- contains functions/methods

Procs stands for processors. These are functions that will generally run logic for specified things.

### Example

CommuneProc runs logic for the commune to update data, make intents, and run sub processes like towers, spawning, creeps, etc.

## Manager
- a static class
- can contain state
- contains functions/methods
- should generally be avoided given its combination of data and functions, which breaks data-oriented design ideals

Managers can be a combination of utilities, processors and data.

## Data

A state or set of states generally contained in an object. Should not include functions

should probably be opperated on by Procs.

### Example

The MarketManager handles caching market related data, updating / deleting it as needed, while pruning and optimizing existing orders that the bot controls.

## Use of classes

Classes should be static, and static classes should not be instantiated. If a class needs to be instantiated, there is probably a better way to do it.

Inherence of classes should be avoided.

Mixing state and state modifiers (functions) in classes should be avoided.
