// //
// * File Imports * //
import { stripMarkdownCodeFence } from "../utils/stripFence";

// * External Imports * //
const vscode = require("vscode");
// //

export async function generateJavadocCommand(uri) {
    const editor = vscode.window.activeTextEditor;

    const targetUri =
        uri || (editor && editor.document && editor.document.uri) || undefined;

    if (!targetUri) {
        vscode.window.showErrorMessage("No Java file selected or active.");
        return;
    }

    const document = await vscode.workspace.openTextDocument(targetUri);

    if (
        document.languageId !== "java" &&
        !document.fileName.endsWith(".java")
    ) {
        vscode.window.showErrorMessage("Selected file is not a Java file.");
        return;
    }

    const originalText = document.getText();
    if (!originalText.trim()) {
        vscode.window.showWarningMessage("File is empty; nothing to document.");
        return;
    }

    const config = vscode.workspace.getConfiguration("ku-javadoc");
    const apiKey = config.get("apiKey");
    const model = config.get("model") || "gpt-4.1-mini";
    const endpoint =
        config.get("endpoint") || "https://api.openai.com/v1/chat/completions";

    if (!apiKey) {
        vscode.window.showErrorMessage(
            "Set ku-javadoc.apiKey in Settings before using this command."
        );
        return;
    }

    const status = vscode.window.setStatusBarMessage(
        "$(sparkle) Generating Javadoc…"
    );

    try {
        const prompt = [
            "You are a Java documentation assistant.",
            "Take the following Java file and add high-quality Javadoc comments to:",
            "- public classes, interfaces, enums",
            "- public and protected methods and constructors",
            "- important fields where it helps readability",
            "",
            "Rules:",
            "- Keep the original code structure and formatting as much as possible.",
            "- Do NOT remove or rename any classes, methods, or fields.",
            "- Output ONLY the full updated Java file, nothing else.",
            "- Do NOT output html tags",
            "",
            "Java file:",
            "```java",
            originalText,
            "```",
        ].join("\n");

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "system",
                        content:
                            "You rewrite Java code by inserting appropriate Javadoc comments while preserving the code behaviour.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const body = await response.text();
            vscode.window.showErrorMessage(
                `KU Javadoc: API call failed (${response.status}). See Output panel for details.`
            );
            const channel = vscode.window.createOutputChannel("KU-Javadoc");
            channel.appendLine(`HTTP ${response.status}`);
            channel.appendLine(body);
            channel.show(true);
            return;
        }

        const data = await response.json();
        const updated =
            data &&
            // @ts-ignore
            data.choices &&
            // @ts-ignore
            data.choices[0] &&
            // @ts-ignore
            data.choices[0].message &&
            // @ts-ignore
            data.choices[0].message.content;

        if (typeof updated !== "string" || !updated.trim()) {
            vscode.window.showErrorMessage(
                "KU Javadoc: Empty response from model."
            );
            return;
        }

        const cleaned = stripMarkdownCodeFence(updated);

        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(originalText.length)
        );

        const edit = new vscode.WorkspaceEdit();
        edit.replace(targetUri, fullRange, cleaned);

        const applied = await vscode.workspace.applyEdit(edit);

        if (!applied) {
            vscode.window.showErrorMessage("KU Javadoc: Failed to apply edit.");
            return;
        }

        await document.save();
        vscode.window.showInformationMessage("Javadoc generated successfully.");
    } catch (err) {
        vscode.window.showErrorMessage(
            `KU-Javadoc: ${String(err && err.message ? err.message : err)}`
        );
    } finally {
        status.dispose();
    }
}
