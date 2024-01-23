# Overview

This document should outline the design strategies and guidelines for the bot.

The bot intends to implement a primarily data-oriented style, with some aspects of functional, imparative and object oriented design.

# Data/functional structures

## Utils
- does not contain any state
- contains functions/methods

Utils stands for utilities. These are functions that will generally take inputs and provide information in return.

### Example

CommuneUtils contains utility functions that provide often cached information on call that helps with processing

## Procs
- does not contain any state
- contains functions/methods

Procs stands for processors. These are functions that will generally run logic for specified things.

### Example

CommuneProc runs logic for the commune to update data, make intents, and run sub processes like towers, spawning, creeps, etc.

## Manager
- contains its own data
- contains functions/methods

Managers can be a combination of utilities, processors and data.

### Example

The MarketManager handles caching market related data, updating / deleting it as needed, while pruning and optimizing existing orders that the bot controls.
