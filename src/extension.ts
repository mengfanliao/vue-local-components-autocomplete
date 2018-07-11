'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import connectData from './data-collector';
import pathCollector from './path-collector';
import ComponentCompletionItemProvider from './completion';
import PathCompletionItemProvider from './completion-path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // let completion = vscode.languages.registerCompletionItemProvider(['pug', 'jade', 'vue', 'html'], completionItemProvider, '', ' ', ':', '<', '"', "'", '/', '@', '(');
    // let vueLanguageConfig = vscode.languages.setLanguageConfiguration('vue', {wordPattern: app.WORD_REG});

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    connectData.collect().then(res => {
        console.log('res', res);
        let completionItemProvider = new ComponentCompletionItemProvider(res);
        connectData.onCompsChange((newComps: object) => {
            completionItemProvider.updateComps(newComps);
        });

        let completion = vscode.languages.registerCompletionItemProvider(
            ['vue'],
            completionItemProvider,
            '', ' ', ':', '<', '"', "'", '/', '@', '('
        );

        let WORD_REG: RegExp = /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/gi;
        let vueLanguageConfig = vscode.languages.setLanguageConfiguration('vue', {wordPattern: WORD_REG});
        // The command has been defined in the package.json file
        // Now provide the implementation of the command with  registerCommand
        // The commandId parameter must match the command field in package.json
        let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
            // The code you place here will be executed every time your command is executed

            // Display a message box to the user
            vscode.window.showInformationMessage('Hello Wumengqiang!');
        });

        context.subscriptions.push(disposable, completion, vueLanguageConfig);
    });

    pathCollector.collect().then((paths: any) => {
        console.log('path completion active');
        let completionItemProvider = new PathCompletionItemProvider(paths);
        pathCollector.onPathsChange((newPaths: Array<string>) => {
            completionItemProvider.updatePaths(newPaths);
        })
        let completion = vscode.languages.registerCompletionItemProvider(
            ['vue', 'javascript'],
            completionItemProvider,
            '', ' ', ':', '<', '"', "'", '/', '@', '(', '~'
        );
        context.subscriptions.push(completion);
    })

}

// this method is called when your extension is deactivated
export function deactivate() {
}