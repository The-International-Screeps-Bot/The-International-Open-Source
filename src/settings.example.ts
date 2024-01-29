import { defaultSettings } from './settingsDefault'

// IMPORTANT: To setup your settings, copy this file, name it settings.ts, and rename settingsExample to settings

/**
 * Edit these settings to your preference
 */
global.settingsExample = {
  // Assigns the default settings
  ...defaultSettings,
  // Your preferences here
  publicRamparts: false,
  // etc...
}

// Some examples for what you would have in settings.ts

// This is how it should look
/*
global.settings = {
    // Assigns the default settings
    ...defaultSettings,
    // Your preferences here
    roomVisuals: false,
    // etc...
}
*/

// And if you want shard or server specific settings
/*
if (Game.shard.name === 'shard2') {

    global.settings = {
        // Assigns the default settings
        ...defaultSettings,
        // Your preferences here
        roomVisuals: false,
        // etc...
    }
}
else if (Game.shard.name === 'season') {

    global.settings = {
        // Assigns the default settings
        ...defaultSettings,
        // Your preferences here
        roomVisuals: false,
        // etc...
    }
}
else {

    global.settings = {
        // Assigns the default settings
        ...defaultSettings,
        // Your preferences here
        roomVisuals: false,
        // etc...
    }
}
*/
