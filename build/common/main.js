"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Main = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const jsonfile_1 = __importDefault(require("jsonfile"));
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const installTar = {
    "x86_64": "horizon-agent-linux-deb-amd64.tar.gz",
    "x64": "horizon-agent-linux-deb-amd64.tar.gz",
    "darwin": "horizon-agent-macos-pkg-x86_64.tar.gz",
    "arrch64": "horizon-agent-linux-deb-arm64.tar.gz",
    "arm64": "horizon-agent-linux-deb-arm64.tar.gz",
    "armv7l": "horizon-agent-linux-deb-armhf.tar.gz",
    "arm": "horizon-agent-linux-deb-armhf.tar.gz"
};
const cr = {
    'ap-north': { public: 'jp.icr.io', private: 'private.jp.icr.io' },
    'ap-south': { public: 'au.icr.io', private: 'private.au.icr.io' },
    'br-sao': { public: 'br.icr.io', private: 'private.br.icr.io' },
    'ca-tor': { public: 'ca.icr.io', private: 'private.ca.icr.io' },
    'eu-central': { public: 'de.icr.io', private: 'private.de.icr.io' },
    'jp-osa': { public: 'jp2.icr.io', private: 'private.jp2.icr.io' },
    'uk-south': { public: 'uk.icr.io', private: 'private.uk.icr.io' },
    'us-south': { public: 'us.icr.io', private: 'private.us.icr.io' },
    'global': { public: 'icr.io', private: 'private.icr.io' }
};
const arch = {
    amd64: 'linux/amd64',
    arm64: 'linux/arm64'
};
class Main {
    constructor(org, dreamAgentName, region, project) {
        this.org = org || 'samsung';
        this.dreamAgentName = dreamAgentName || 'myApplication.yaml';
        this.region = region || 'us-south';
        this.project = project || 'ieam';
        console.log(process.cwd(), process.env.USERPROFILE);
        this.homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
        this.hznPath = `${this.homePath}/hzn-config`;
        this.androidPath = `${this.hznPath}/android`;
        this.distPath = `${this.androidPath}/${this.org}`;
        this.configPath = `${this.distPath}/config`;
        this.configFile = `${this.hznPath}/.env-local.json`;
        this.globalPath = (0, path_1.resolve)(process.execPath, '../../lib/node_modules');
        this.ohaPath = `${this.globalPath}/oh-android`;
    }
    inititialise() {
        if (!(0, fs_1.existsSync)(this.hznPath)) {
            (0, fs_1.mkdirSync)(this.hznPath);
        }
        if (!(0, fs_1.existsSync)(this.androidPath)) {
            (0, fs_1.mkdirSync)(this.androidPath);
        }
        if (!(0, fs_1.existsSync)(this.distPath)) {
            (0, fs_1.mkdirSync)(this.distPath);
        }
        if (!(0, fs_1.existsSync)(this.configPath)) {
            (0, fs_1.mkdirSync)(this.configPath);
        }
        if ((0, fs_1.existsSync)(this.configFile)) {
            console.log(this.configFile, this.org);
            this.envar = JSON.parse((0, fs_1.readFileSync)(this.configFile).toString())[this.org];
        }
        // initialize vars needed for token replacement in dockerfile-template file
        const version = this.envar.ANAX_VERSION.toLowerCase().replace('v', '');
        this.envar.HORIZON_AGENT_GZ = installTar[this.envar.ARCH];
        this.envar.HORIZON_AGENT_TAR = this.envar.HORIZON_AGENT_GZ.replace('.gz', '');
        this.envar.HORIZON_AGENT = this.envar.HORIZON_AGENT_TAR.replace('horizon-agent-linux-deb-', `horizon_${version}_`).replace('.tar', '.deb');
        this.envar.HORIZON_CLI = this.envar.HORIZON_AGENT_TAR.replace('horizon-agent-linux-deb-', `horizon-cli_${version}_`).replace('.tar', '.deb');
        this.envar.ETC_DEFAULT = this.distPath;
        this.envar.HORIZON_CONFIG = this.configPath;
        this.imageName = this.envar.REGISTRY;
        if (this.envar.NAME_SPACE && this.envar.NAME_SPACE.length > 0) {
            this.imageName += `/${this.envar.NAME_SPACE}`;
        }
        this.imageName += `/${this.envar.SERVICE_NAME}_${this.envar.ARCH}:${version}`;
        this.envar.IMAGE_NAME = this.imageName;
    }
    configExists() {
        return (0, fs_1.existsSync)(this.configFile);
    }
    replaceToken(template, obj) {
        Object.keys(obj).forEach((key) => {
            let regex = new RegExp(`\\\${${key}}`, 'g');
            template = template.replace(regex, obj[key]);
        });
        return template;
    }
    tokenReplace(template, obj) {
        //  template = 'Where is ${movie} playing?',
        //  tokenReplace(template, {movie: movie});
        console.log(obj);
        return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, (match, key) => {
            console.log('match: ', key, obj[key]);
            return obj[key];
        });
    }
    makeAll() {
        return new rxjs_1.Observable((observer) => {
            let $build = {}, i = 0;
            this.makeDeploy()
                .subscribe(() => {
                this.buildImage(this.imageName)
                    .subscribe(() => {
                    this.pushImage(this.imageName)
                        .subscribe(() => { });
                });
            });
        });
    }
    makeDeploy() {
        return new rxjs_1.Observable((observer) => {
            let $build = {}, i = 0;
            this.makeSystemFiles()
                .subscribe(() => {
                $build[i++] = this.adbPushDreamAgent();
                $build[i++] = this.adbPushHorizon();
                $build[i++] = this.adbPushHznConfigJson();
                $build[i++] = this.adbPushPolicy();
                $build[i++] = this.adbPushCert();
                (0, rxjs_1.forkJoin)($build)
                    .subscribe(() => { observer.next(); observer.complete(); });
            });
        });
    }
    makeSystemFiles() {
        console.log(process.cwd(), this.globalPath);
        return new rxjs_1.Observable((observer) => {
            let $build = {}, i = 0;
            $build[i++] = this.makeHznConfigJson();
            $build[i++] = this.makeHorizon();
            $build[i++] = this.makeAnaxJson();
            $build[i++] = this.makeHznJson();
            $build[i++] = this.makeDockerFile();
            $build[i++] = this.makeDreamAgentYaml();
            $build[i++] = this.makeNodePolicy();
            $build[i++] = this.makeDirectories();
            (0, rxjs_1.forkJoin)($build)
                .subscribe({
                next: (res) => { observer.next(); observer.complete(); }
            });
        });
    }
    makeHznConfigJson() {
        return new rxjs_1.Observable((observer) => {
            try {
                let file = (0, fs_1.readFileSync)(`${this.ohaPath}/templates/env-hzn.json`).toString();
                file = this.replaceToken(file, this.envar);
                this.hznConfigJson = this.envar['HZN_CONFIG_JSON'] || 'ieam-samsung-samsung.json';
                (0, fs_1.writeFileSync)(`${this.distPath}/${this.hznConfigJson}`, file);
                console.log('hzn config file generated');
            }
            catch (e) {
                console.log(e);
            }
            observer.next();
            observer.complete();
        });
    }
    makeHorizon() {
        return new rxjs_1.Observable((observer) => {
            try {
                let file = (0, fs_1.readFileSync)(`${this.ohaPath}/templates/horizon`).toString();
                file = this.replaceToken(file, this.envar);
                (0, fs_1.writeFileSync)(`${this.distPath}/horizon`, file);
                console.log('horizon file generated');
            }
            catch (e) {
                console.log(e);
            }
            observer.next();
            observer.complete();
        });
    }
    makeAnaxJson() {
        return new rxjs_1.Observable((observer) => {
            try {
                let file = (0, fs_1.readFileSync)(`${this.ohaPath}/templates/anax.json`).toString();
                file = this.replaceToken(file, this.envar);
                (0, fs_1.writeFileSync)(`${this.configPath}/anax.json`, file);
                console.log('anax.json file generated');
            }
            catch (e) {
                console.log(e);
            }
            observer.next();
            observer.complete();
        });
    }
    makeHznJson() {
        return new rxjs_1.Observable((observer) => {
            try {
                let file = (0, fs_1.readFileSync)(`${this.ohaPath}/templates/hzn.json`).toString();
                file = this.replaceToken(file, this.envar);
                (0, fs_1.writeFileSync)(`${this.configPath}/hzn.json`, file);
                console.log('hzn.json file generated');
            }
            catch (e) {
                console.log(e);
            }
            observer.next();
            observer.complete();
        });
    }
    makeNodePolicy() {
        return new rxjs_1.Observable((observer) => {
            if (this.envar.NODE_POLICY) {
                jsonfile_1.default.writeFileSync(`${this.distPath}/node.policy.json`, this.envar.NODE_POLICY, { spaces: 2 });
                console.log(`${this.distPath}/node.policy.json generated`);
            }
            observer.next();
            observer.complete();
        });
    }
    makeDreamAgentYaml() {
        return new rxjs_1.Observable((observer) => {
            try {
                let file = (0, fs_1.readFileSync)(`${this.ohaPath}/templates/dream-agent.yaml`).toString();
                file = this.replaceToken(file, this.envar);
                (0, fs_1.writeFileSync)(`${this.distPath}/${this.dreamAgentName}`, file);
                console.log(`${this.distPath}/${this.dreamAgentName} generated`);
            }
            catch (e) {
                console.log(e);
            }
            observer.next();
            observer.complete();
        });
    }
    makeDockerFile() {
        return new rxjs_1.Observable((observer) => {
            try {
                let file = (0, fs_1.readFileSync)(`${this.ohaPath}/templates/dockerfile-template`).toString();
                file = this.replaceToken(file, this.envar);
                (0, fs_1.writeFileSync)(`${this.androidPath}/Dockerfile`, file);
                console.log('Dockerfile generated');
            }
            catch (e) {
                console.log(e);
            }
            observer.next();
            observer.complete();
        });
    }
    adbPushDreamAgent() {
        return new rxjs_1.Observable((observer) => {
            const dreamAgentPath = this.envar.DREAM_AGENT_PATH || '/sdcard/Android/data/com.srbr.dreamagent/files/docker/';
            const arg = `adb push ${this.distPath}/${this.dreamAgentName} ${dreamAgentPath}`;
            this.shell(arg, `done pushing ${this.dreamAgentName}`, `failed to push ${this.dreamAgentName}`, false)
                .subscribe({
                complete: () => { },
                error: (err) => {
                    console.log(err);
                }
            });
            observer.next();
            observer.complete();
        });
    }
    adbPushCert() {
        return new rxjs_1.Observable((observer) => {
            const arg = `adb push ${this.envar.PROVIDE_CERT} /data/var/agent-install.crt`;
            this.shell(arg, `done pushing cert`, `failed to push cert`, false)
                .subscribe({
                complete: () => { },
                error: (err) => {
                    console.log(err);
                }
            });
            observer.next();
            observer.complete();
        });
    }
    adbPushHorizon() {
        return new rxjs_1.Observable((observer) => {
            const arg = `adb push ${this.distPath}/horizon /data/var`;
            this.shell(arg, `done pushing horizon`, `failed to push horizon`, false)
                .subscribe({
                complete: () => { },
                error: (err) => {
                    console.log(err);
                }
            });
            observer.next();
            observer.complete();
        });
    }
    adbPushHznConfigJson() {
        return new rxjs_1.Observable((observer) => {
            const arg = `adb push ${this.distPath}/${this.hznConfigJson} /data/var`;
            this.shell(arg, `done pushing hzn config file`, `failed to push hzn config file`, false)
                .subscribe({
                complete: () => { },
                error: (err) => {
                    console.log(err);
                }
            });
            observer.next();
            observer.complete();
        });
    }
    adbPushPolicy() {
        return new rxjs_1.Observable((observer) => {
            const arg = `adb push ${this.distPath}/node.policy.json /data/var`;
            this.shell(arg, `done pushing node policy`, `failed to push node policy`, false)
                .subscribe({
                complete: () => { },
                error: (err) => {
                    console.log(err);
                }
            });
            observer.next();
            observer.complete();
        });
    }
    makeDirectories() {
        const dirs = [
            `/data/var/tmp/horizon/${this.envar.CONTAINER_NAME}`,
            `/data/var/tmp/horizon/${this.envar.CONTAINER_NAME}/fss-domain-socket`,
            `/data/var/tmp/horizon/${this.envar.CONTAINER_NAME}/ess-auth`,
            `/data/var/tmp/horizon/${this.envar.CONTAINER_NAME}/secrets`,
            `/data/var/tmp/horizon/${this.envar.CONTAINER_NAME}/nmp`
        ];
        return new rxjs_1.Observable((observer) => {
            try {
                let $listDir = {};
                for (let i = 0; i < dirs.length; i++) {
                    $listDir[dirs[i]] = this.listDir(dirs[i]);
                }
                (0, rxjs_1.forkJoin)($listDir)
                    .subscribe({
                    next: (result) => {
                        let $makeDir = {};
                        Object.keys(result).forEach((key) => {
                            if (!result[key].exist) {
                                let dirName = result[key].dir;
                                let arg = `adb shell mkdir ${dirName}`;
                                $makeDir[key] = this.shell(arg, `done mkdir ${dirName}`, `failed to mkdir ${dirName}`, false);
                            }
                        });
                        if (Object.keys($makeDir).length == 0) {
                            console.log('Directories already exist, nothing to do...');
                            observer.next();
                            observer.complete();
                        }
                        else {
                            (0, rxjs_1.forkJoin)($makeDir)
                                .subscribe({
                                next: (result) => {
                                    //console.log(result)
                                },
                                complete: () => {
                                    observer.next();
                                    observer.complete();
                                },
                                error: (err) => {
                                    console.log(err);
                                }
                            });
                        }
                    },
                    error: (err) => {
                        console.log(err);
                    }
                });
            }
            catch (e) {
                console.log(e);
                process.exit(0);
            }
        });
    }
    listDir(dirName) {
        return new rxjs_1.Observable((observer) => {
            if (dirName) {
                let arg = `adb shell ls ${dirName}`;
                this.shell(arg, `done ls ${dirName}`, `failed to ls ${dirName}`, false)
                    .subscribe({
                    next: (res) => {
                        observer.next({ dir: dirName, exist: true });
                        observer.complete();
                    },
                    error: (err) => {
                        observer.next({ dir: dirName, exist: false });
                        observer.complete();
                    }
                });
            }
            else {
                console.log('Please specify dir name.');
                process.exit(0);
            }
        });
    }
    makeDir(dirName) {
        return new rxjs_1.Observable((observer) => {
            if (dirName) {
                let arg = `adb shell mkdir ${dirName}`;
                this.shell(arg, `done mkdir ${dirName}`, `failed to mkdir ${dirName}`, false)
                    .subscribe({
                    complete: () => observer.complete(),
                    error: (err) => {
                        process.exit(0);
                    }
                });
            }
            else {
                console.log('Please specify dir name.');
                process.exit(0);
            }
        });
    }
    switchRegion() {
        return new rxjs_1.Observable((observer) => {
            if (this.region && cr[this.region]) {
                let arg = `ibmcloud cr region-set ${this.region} && ibmcloud cr login`;
                this.shell(arg, `done switching to ${this.region}`, `failed to switch to ${this.region}`, false)
                    .subscribe({
                    complete: () => observer.complete(),
                    error: (err) => {
                        process.exit(0);
                    }
                });
            }
            else {
                console.log('Please specify a valid region.');
                process.exit(0);
            }
        });
    }
    buildImage(imageName) {
        return new rxjs_1.Observable((observer) => {
            let arg = `docker build --platform ${arch[this.envar.ARCH]} -t ${imageName} -f ${this.androidPath}/Dockerfile .`;
            this.shell(arg, `done building ${imageName} image`, `failed to build ${imageName} image`)
                .subscribe(() => {
                observer.next();
                observer.complete();
            });
        });
    }
    pushImage(imageName) {
        return new rxjs_1.Observable((observer) => {
            let arg = `docker push ${imageName}`;
            this.shell(arg, `done pushing ${imageName} image`, `failed to push ${imageName} image`)
                .subscribe(() => {
                observer.next();
                observer.complete();
            });
        });
    }
    ibmLogin() {
        return new rxjs_1.Observable((observer) => {
            process.chdir(this.ohaPath);
            let arg = `npm run ibm-login </dev/tty`;
            this.shell(arg, `done login`, `failed to login`)
                .subscribe(() => {
                observer.next();
                observer.complete();
            });
        });
    }
    shell(arg, success = 'command executed successfully', error = 'command failed', prnStdout = true, options = { maxBuffer: 1024 * 2000 }) {
        return new rxjs_1.Observable((observer) => {
            console.log(arg);
            let child = (0, child_process_1.exec)(arg, options, (err, stdout, stderr) => {
                if (!err) {
                    // console.log(stdout);
                    console.log(success);
                    observer.next(prnStdout ? stdout : '');
                    observer.complete();
                }
                else {
                    console.log(`${error}: ${err}`);
                    observer.error(err);
                }
            });
            child.stdout.pipe(process.stdout);
            child.on('data', (data) => {
                console.log('data: ', data);
            });
        });
    }
}
exports.Main = Main;
//# sourceMappingURL=main.js.map