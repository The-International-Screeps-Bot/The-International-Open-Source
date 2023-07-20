/**
 * For contibutors to run custom scripts without conflict with commits. Code in this folder is gitignored
 */
class UserScriptManager {
    constructor() {


    }
    run() {
        console.log('hello')
    }
}

export const userScriptManager = new UserScriptManager()
