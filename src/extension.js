// //
// * File Imports * //
import generateJavadocCommand from "./libs/generateCommand.js";

// * External Imports * //
import * as vscode from "vscode";
// //

export function activate(context) {
    const disposable = vscode.commands.registerCommand(
        "ku-javadoc.generateFileDocs",
        generateJavadocCommand
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}
