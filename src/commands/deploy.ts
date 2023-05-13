import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';

import { commands } from '../common/interface';
import { Main } from '../common/main';

import type { Arguments, CommandBuilder } from 'yargs';
type Options = {
  action: string;
};
export const command: string = 'deploy <action>';
export const desc: string = 'Deploy <action> to Org <org>';
let availableActions = 'Available actions:'

commands.sort().forEach((action) => {
  availableActions += ` ${action}`
}) 

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs
    .options({
      org: {type: 'string', desc: 'Organization to be deployed to'},
      dreamAgentName: {type: 'string', desc: 'DreamAgent yaml file name'},
      region: {type: 'string', desc: 'Region to deploy to'},
      project: {type: 'string', desc: 'Project name'}
    })
    .positional('action', {
      type: 'string', 
      demandOption: true,
      desc: availableActions
    });

export const handler = (argv: Arguments<Options>): void => {
  clear();
  console.log(
    chalk.greenBright(
      figlet.textSync('oh-android', { horizontalLayout: 'full' })
    )
  );
  const { action, org, dreamAgentName, region, project } = argv;
  const hzn = new Main(org, dreamAgentName, region, project);
  if(!hzn.configExists()) {
    console.log('.env-local.json does not exist.');
  } else {
    hzn.inititialise();
    console.log('action: ', action)
    if(hzn[action]) {
      hzn[action]()
      .subscribe({
        next: (msg: string) => {
          if(msg) {
            console.log(msg)
          }  
        },
        complete: () => {
          console.log('process completed.');
          process.exit(0)          
        }
      })      
    } else {
      console.log(`${action} doesn't exist.  oha deploy -h for help`)
    }
  }
}