// //
// * File Imports * //
import { generateJavadocCommand } from "./libs/generateCommand.js";

// * External Imports * //
const vscode = require("vscode");
// //

function activate(context) {
    const disposable = vscode.commands.registerCommand(
        "ku-javadoc.generateFileDocs",
        generateJavadocCommand
    );

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
