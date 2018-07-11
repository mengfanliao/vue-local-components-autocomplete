import {workspace, EventEmitter, Uri, FileSystemWatcher} from 'vscode';
import config from './config';
const path = require('path');
console.log(config);

class PathCollector {
    private paths: Array<string>;
    private rootPathLength: number;
    private eventEmitter: EventEmitter<Array<string>> = new EventEmitter();
    private fsWatcher: FileSystemWatcher;
    constructor() {
        this.paths = [];
        this.rootPathLength = path.resolve(config.dir).length - config.dir.length - 1;
        this.fsWatcher = workspace.createFileSystemWatcher(`**/${config.dir}/**`, false, false, false);
        let subscriptions:any = [];

        // 监听文件添加、删除事件，从而实时变更path
        this.fsWatcher.onDidCreate(this.onDidCreate, this, subscriptions);
        this.fsWatcher.onDidDelete(this.onDidDelete, this, subscriptions);
    }

    getPaths() {
        return this.paths;
    }

    onDidCreate(url:Uri) {
        let newPath = url.path.slice(this.rootPathLength);
        if (this.paths.indexOf(newPath) === -1) {
            this.paths.push(newPath);
            this.eventEmitter.fire(this.paths);
        }
    }

    onDidDelete(url:Uri) {
        let deletedPath = url.path.slice(this.rootPathLength);
        let index = this.paths.indexOf(deletedPath);
        if (index !== -1) {
            this.paths.splice(index, 1);
            this.eventEmitter.fire(this.paths);
        }
    }

    get onPathsChange() {
        return this.eventEmitter.event;
    }

    collect() {
        return new Promise((resolve, reject) => {
            if (!config.dir) return;
            // tslint-disable-next-line
            workspace.findFiles(config.dir + '/**', '**/node_modules/**', 500).then(res => {
                /* res格式 array[]  item格式如下
                    $mid:1
                    fsPath:"/Users/wumengqiang/work/hotel-fe-linen-pc/src/App.vue"
                    external:"file:///Users/wumengqiang/work/hotel-fe-linen-pc/src/App.vue"
                    path:"/Users/wumengqiang/work/hotel-fe-linen-pc/src/App.vue"
                    scheme:"file"
                */
                let paths: Array<string>= res.map(v => v.path.slice(this.rootPathLength));
                console.log(paths);
                this.paths = paths;
                resolve(paths);
            })
        });
    }
}

export default new PathCollector();