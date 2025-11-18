// //
// * File Imports * //
import generateJavadocCommand, {
    GENERATING_CONTEXT_KEY,
} from "./libs/generateCommand.js";

// * External Imports * //
import * as vscode from "vscode";
// //

export function activate(context) {
    const disposable = vscode.commands.registerCommand(
        "ku-javadoc.generateFileDocs",
        generateJavadocCommand
    );

    const busyDisposable = vscode.commands.registerCommand(
        "ku-javadoc.generateFileDocsBusy",
        () => {
            vscode.window.showInformationMessage(
                "Javadoc generation is already in progress."
            );
        }
    );

    void vscode.commands.executeCommand(
        "setContext",
        GENERATING_CONTEXT_KEY,
        false
    );

    context.subscriptions.push(disposable, busyDisposable);
}

export function deactivate() {}
