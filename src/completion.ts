import {
    CancellationToken, CompletionItemProvider, ProviderResult,
    TextDocument, Position, CompletionItem, CompletionList, CompletionItemKind,
    SnippetString, Range
} from 'vscode';
import config from './config';

// 对html进行格式化 从而变得更加漂亮
const prettyHTML = require('pretty');

export default class ComponentCompletionItemProvider implements CompletionItemProvider {
    private fileData: any;
    private _document: any; 
    private _position: any;
    // private tagReg: RegExp = /<([\w-]+)\s+/g;
    // private attrReg: RegExp = /(?:\(|\s*)(\w+)=['"][^'"]*/;
    private tagStartReg:  RegExp = /<([\w-]*)$/;
    // private pugTagStartReg: RegExp = /^\s*[\w-]*$/;
    // private size: number;
    // private quotes: string;

    constructor(fileData: object) {
        this.fileData = fileData;
    }

    updateComps(fileData: object) {
        this.fileData = fileData;
    }

    // tentative plan for vue file
    notInTemplate(): boolean {
        let line = this._position.line;
        while(line) {
            if (/^\s*<script.*>\s*$/.test(<string>this._document.lineAt(line).text)) {
                return true;
            }
            line--;
        }
        return false;
    }

    getTextBeforePosition(position: Position): string {
        var start = new Position(position.line, 0);
        var range = new Range(start, position);
        return this._document.getText(range);
    }

    isTagStart() {
        let txt = this.getTextBeforePosition(this._position);
        return this.tagStartReg.test(txt);
    }
    
    getTagSuggestion() {
        let suggestions = [];
    
        let id = 200;
        for (let tag in this.fileData) {
            suggestions.push(this.buildTagSuggestion(tag, this.fileData[tag], id));
            id++;
        }
        console.log(suggestions);
        return suggestions;
    }

    buildTagSuggestion(tag:any, tagVal:any, id:any) {
        let snippets = '';
        let index = 0;
        let attrs = tagVal.props.reduce((mem:string, item:string, i:number) => {
            return mem += ` ${item}=${config.quote}$${index + i + 1}${config.quote}`;
        }, '');

        snippets += tag + attrs + `></${tag}>`;

        return {
            label: tag,
            sortText: `0${id}${tag}`,
            insertText: new SnippetString(
                prettyHTML('<' + snippets, {indent_size: config.indentSize}).substr(1)),
            kind: CompletionItemKind.Snippet,
            documentation: 'project components'
        }
    }

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList> {
        console.log('component complete item in');
        this._document = document;
        this._position = position;
        if (this.isTagStart()) {
            return this.notInTemplate() ? [] : this.getTagSuggestion();
        }
        return [];
    }


}