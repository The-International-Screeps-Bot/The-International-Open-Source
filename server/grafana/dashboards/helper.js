const serviceInfo = require("./serviceInfo.json");
const stats = require("./stats.json");
const serverStats = require("./serverStats.json");

function setupDashboard(dashboard) {
    delete dashboard.id;
    delete dashboard.uid;
    for (let i = 0; i < dashboard.templating.list.length; i++) {
        const datasource = dashboard.templating.list[i].datasource
        if (!datasource) continue
        delete datasource.type;
        delete datasource.uid;
    }

        for (let i = 0; i < dashboard.panels.length; i++) {
        const panel = dashboard.panels[i];
        if (panel.panels) {
            for (let y = 0; y < panel.panels.length; y++) {
                const subPanel = panel.panels[y];
                delete subPanel.datasource.uid;
                delete subPanel.datasource.type;
            }
        }
        else if (panel.type !== 'row') {
            delete panel.datasource.uid;
            delete panel.datasource.type;
        }
    }
    return {dashboard:dashboard};
}

module.exports.getDashboards = ()=>{
    return {serverStats:setupDashboard(serverStats),stats:setupDashboard(stats),serviceInfo:setupDashboard(serviceInfo)};
}

