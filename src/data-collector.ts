/*
    收集当前项目下的vue文件的name信息和props信息
*/
import {workspace, EventEmitter, Uri, FileSystemWatcher} from 'vscode';
const fs = require('fs');
const path = require('path');
var acorn = require("acorn");
import utils from './utils';
import config from './config';
acorn = require('acorn-jsx/inject.js')(acorn);



class DataCollector {
    private comps: object;
    private eventEmitter: EventEmitter<object> = new EventEmitter();
    private fsWatcher: FileSystemWatcher;
    constructor() {
        this.comps = {};  
        // 监听文件改变事件，从而实时进行组件分析。
        let subscriptions:any = [];
        this.fsWatcher = workspace.createFileSystemWatcher(`**/${config.dir}/**/*.vue`, false, false, false);
        this.fsWatcher.onDidChange(this.onDidChange, this, subscriptions);
    }

    onDidChange(url:Uri) {
        console.log('component file changed');
        this.fillFileData(url, this.comps).then(res => {
            this.eventEmitter.fire(this.comps);
            console.log('component data changed');
        });
    }

    get onCompsChange() {
        return this.eventEmitter.event;
    }

    collect() {
        return new Promise((resolve) => {
            // 找到src目录下所有vue文件信息
            workspace.findFiles(config.dir + '/**/*.vue', '**/node_modules/**', 500).then(res => {
                /* res格式 array[]  item格式如下
                    $mid:1
                    fsPath:"/Users/wumengqiang/work/hotel-fe-linen-pc/src/App.vue"
                    external:"file:///Users/wumengqiang/work/hotel-fe-linen-pc/src/App.vue"
                    path:"/Users/wumengqiang/work/hotel-fe-linen-pc/src/App.vue"
                    scheme:"file"
                */
                let meta: {[s: string]: any} = {};
                console.log(Date.now());
                let promises = res.map(v => {
                    return this.fillFileData(v, meta)
                });
                Promise.all(promises).then(() => {
                    resolve(meta);
                });
            })
            
        });
    }

    fillFileData(file: {[s: string]: any}, meta: {[s: string]: any}) {
        let filename = path.basename(file.fsPath, '.vue');
        return new Promise(resolve => {
            fs.readFile(file.fsPath, 'utf8', (err: Error, data: string) => {
                if (err) {
                    resolve();
                    return;
                }
                try {
                    let scriptTag = data.match(/<script *(type=.+)?>/);
                    if (! scriptTag) {
                        resolve();
                        return;
                    }
                    let start = data.indexOf(scriptTag[0]);
                    let end = data.indexOf('</script>');
                    // 提取script内容
                    let jsContent = data.slice(start + scriptTag[0].length, end);
                    // ast语法树
                    let ast = acorn.parse(jsContent, {
                        sourceType: "module",
                        ecmaVersion: 9,
                        plugins: {
                            jsx: true
                        }
                    });
                    let name:string;
                    let propsArr:Array<string>;
                    if (ast.body && ast.body.length > 0) {
                        // 遍历语法库
                        ast.body.some((node:any) => {
                            // export 语法
                            if (node && node.type === 'ExportDefaultDeclaration' &&
                                node.declaration.type === 'ObjectExpression') {
                                let keyNodes = node.declaration.properties;
                                keyNodes.forEach((v:any) => {
                                    if (v.type === 'Property' &&
                                        !v.method &&
                                        !v.shorthand &&
                                        v.key
                                    ) {
                                        if (v.key.name === 'name') {
                                            name = v.value.value;
                                        }
    
                                        if (v.key.name === 'props') {
                                            if (v.value.type === 'ArrayExpression') {
                                                propsArr = v.value.elements.map(
                                                    (item: any) => {
                                                        if (item.value === 'value') {
                                                            return 'v-model';
                                                        }
                                                        return utils.toKebabCase(item.value)
                                                    }
                                                );
                                            } else if (v.value.type === 'ObjectExpression') {
                                                propsArr = v.value.properties.map(
                                                    (item:any) => {
                                                        if (item.key.name === 'value') {
                                                            return 'v-model';
                                                        }
                                                        return utils.toKebabCase(item.key.name)
                                                    }
                                                );
                                            }
                                        }
                                    }
                                });
                                name = name || utils.toKebabCase(filename)
                                if (name !== 'index') {
                                    meta[name] = {
                                        name: name,
                                        props: propsArr || [],
                                        path: file.fsPath,
                                        filename
                                    };
                                }
                                return true;
                            }
                            return false;
                        })
                    }
                } catch(e) {
                    throw e;
                }
                resolve();
            });
        });
    }
}

export default new DataCollector();
