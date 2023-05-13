export const commands = [
  'makeAll', 'makeDeploy', 'makeSystemFiles', 'makeHorizon', 'makeAnaxJson', 
  'makeNodePolicy', 'makeDreamAgentYaml', 'makeDockerFile', 'makeDirectories', 'buildImage',
  'pushImage', 'adbPushDreamAgent', 'adbPush', 'ibmLogin'
];

export interface IHznParam {
  org: string;
  region: string;
  dreamAgentName: string;
}
