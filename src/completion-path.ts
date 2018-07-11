/*
    webpack alias后的文件夹路径自动匹配
*/
import {
    CancellationToken, CompletionItemProvider, ProviderResult, workspace,
    TextDocument, Position, CompletionItem, CompletionList, CompletionItemKind, Range
} from 'vscode';
import config from './config';
const path = require('path');

export default class ComponentCompletionItemProvider implements CompletionItemProvider {
    private paths: Array<string>;
    private _document: any; 
    private _position: any;
    private absImportTag: RegExp = /^\s*@?import.* +['"]~?([^'".; \)]+)$/;
    // private isStyleImport: RegExp = /^\s*import.+(\'|\")~/;

    constructor(paths: Array<string>) {
        this.paths = paths;
    }

    updatePaths(paths: Array<string>) {
        this.paths = paths;
    }

    getTextBeforePosition(position: Position): string {
        var start = new Position(position.line, 0);
        var range = new Range(start, position);
        return this._document.getText(range);
    }

    isAbsImportStart() {
        let txt = this.getTextBeforePosition(this._position);
        return this.absImportTag.test(txt);
    }

    /*
        @param p {string} Path
    */
    matchAll(p: string, keyword: string) {
        let paths = [];
        let suggestionPath;
        let isDirectory;
        let keywordIndex;
        let slashIndex;
        while(p) {
            suggestionPath = '';
            isDirectory = true;
            if (p.indexOf(keyword) === 0) {
                keywordIndex = 0;
            } else if(p.indexOf('/' + keyword) !== -1) {
                keywordIndex = p.indexOf('/' + keyword) + 1;
            } else {
                break;
            }
            slashIndex = p.slice(keywordIndex + keyword.length).indexOf('/');
            if (slashIndex === -1) {
                slashIndex = p.length;
                isDirectory = false;
            } else {
                slashIndex += keywordIndex + keyword.length;
            }
            suggestionPath = p.slice(keywordIndex, slashIndex);
            p = p.slice(slashIndex + 1);
            paths.push({
                suggestionPath,
                isDirectory
            });
        }
        return paths;     
    }


    getPathSuggestion() {
        let startTime = Date.now();
        let txt = this.getTextBeforePosition(this._position);
        let inputPath = txt.match(this.absImportTag);
        if (inputPath && inputPath.length > 1) {
            let keyword = inputPath[1];
            let suggestions:any = [];
            let command:any;
            if (workspace
                    .getConfiguration('path-autocomplete')
                    .get('enableFolderTrailingSlash', this._document.uri || null)) {
                command = {
                    command: 'default:type',
                    title: 'triggerSuggest',
                    arguments: [{
                        text: '/'
                    }]
                };
            }
            let paths = new Set();
            this.paths.forEach(v => {
                this.matchAll(v, keyword).forEach(p => {
                    let suggestionPath = path.basename(p.suggestionPath);
                    let isDirectory = p.isDirectory;

                    if (suggestionPath && !paths.has(suggestionPath)) {
                        paths.add(suggestionPath);
                        let insertText = suggestionPath;

                        if (!isDirectory) {
                            // 去除文件名后缀
                            config.extHiddingList.forEach(v => {
                                if (suggestionPath.endsWith(v)) {
                                    insertText = suggestionPath.slice(0, suggestionPath.length - v.length)
                                }
                            })
                        }

                        suggestions.push({
                            label: suggestionPath + (isDirectory ? '/' : ''),
                            sortText: isDirectory ? 'd' : 'f',
                            insertText,
                            command: isDirectory ? command : null,
                            kind: CompletionItemKind.Snippet,
                            documentation: 'path autocompletion'
                        })
                    }
                })


            });
            console.log(suggestions);
            return suggestions;
        }
        return [];
    }

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList> {
        console.log('path in');
        this._document = document;
        this._position = position;
        if (this.isAbsImportStart()) {
            return this.getPathSuggestion();
        }
        return [];
    }


}