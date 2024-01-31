# Overview

This document should outline the design strategies and guidelines for the bot.

The bot intends to implement a primarily data-oriented style, with some aspects of functional, imparative and object oriented design.

# Data/functional structures

## Utils
- a static class
- does not contain any state
- contains functions/methods
- acts on singular inputs

Utils stands for utilities. These are functions that will generally take inputs and provide information in return.

### Example

CommuneUtils contains utility functions that provide often cached information on call that helps with processing

## Procs
- a static class
- does not contain any state
- contains functions/methods
- acts on singular inputs

Procs stands for processors. These are functions that will generally run logic for specified things.

### Example

CommuneProc runs logic for the commune to update data, make intents, and run sub processes like towers, spawning, creeps, etc.

## Ops
- a static class
- does not contain any state
- contains functions/methods
- acts on singular inputs

Ops stands for Operations. These are functions that will run logic for specified things, sometimes retrieving values.

### Example

HaulerNeedOps contians functions that provide cached information, carry out processes, or whatever else.

## Services
- a static class
- does not contain any state
- contains function/methods
- acts on plural inputs

Services run plural inputs, which in turn are generally ran through procs and utils.

### Example

RoomServices contains functions that runs logic for a list of rooms.

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

Classes should be static, and static classes should not be instantiated. If a class "needs" to be instantiated, there is probably a better way to do it.

Inherence of classes should be avoided.
classes should no contain state and alter state. They should do only one or the other.

# Creep Tasks

Allows creeps to track general inter-tick actions that are desired for fulfillment

## Task Runners

Task runners decide what actions to take based on the task data provided. Besides running tasks, runners may delete tasks, stop additional tasks to be ran, and more
