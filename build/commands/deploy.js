"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const chalk_1 = __importDefault(require("chalk"));
const clear_1 = __importDefault(require("clear"));
const figlet_1 = __importDefault(require("figlet"));
const interface_1 = require("../common/interface");
const main_1 = require("../common/main");
exports.command = 'deploy <action>';
exports.desc = 'Deploy <action> to Org <org>';
let availableActions = 'Available actions:';
interface_1.commands.sort().forEach((action) => {
    availableActions += ` ${action}`;
});
const builder = (yargs) => yargs
    .options({
    org: { type: 'string', desc: 'Organization to be deployed to' },
    dreamAgentName: { type: 'string', desc: 'DreamAgent yaml file name' },
    region: { type: 'string', desc: 'Region to deploy to' },
    project: { type: 'string', desc: 'Project name' }
})
    .positional('action', {
    type: 'string',
    demandOption: true,
    desc: availableActions
});
exports.builder = builder;
const handler = (argv) => {
    (0, clear_1.default)();
    console.log(chalk_1.default.greenBright(figlet_1.default.textSync('oh-android', { horizontalLayout: 'full' })));
    const { action, org, dreamAgentName, region, project } = argv;
    const hzn = new main_1.Main(org, dreamAgentName, region, project);
    if (!hzn.configExists()) {
        console.log('.env-local.json does not exist.');
    }
    else {
        hzn.inititialise();
        console.log('action: ', action);
        if (hzn[action]) {
            hzn[action]()
                .subscribe({
                next: (msg) => {
                    if (msg) {
                        console.log(msg);
                    }
                },
                complete: () => {
                    console.log('process completed.');
                    process.exit(0);
                }
            });
        }
        else {
            console.log(`${action} doesn't exist.  oha deploy -h for help`);
        }
    }
};
exports.handler = handler;
//# sourceMappingURL=deploy.js.map