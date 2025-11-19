<div align="center">
  <h1>KU Javadoc – VS Code Extension</h1>
  <div>
    
![GitHub Release](https://img.shields.io/github/v/release/jaynightmare/KU-Javadoc-Generator?style=flat-square)
    <a href="https://marketplace.visualstudio.com/items?itemName=jaynightmare.ku-javadoc">
      <img src="https://img.shields.io/visual-studio-marketplace/v/jaynightmare.ku-javadoc?label=VS%20Code%20Marketplace&style=flat-square" alt="VS Code Marketplace" />
    </a>
    </div>
</div>

# Kingston University (KU) Javadoc – VS Code Extension

KU Javadoc is a Visual Studio Code extension that generates Javadoc comments for Java files using an AI model.

Right–click any `.java` file (or press the icon on the toolbar), choose **"Generate Javadoc for File"**, and the extension will:

1. Send the file contents to an AI model.
2. Insert appropriate Javadoc comments into the code.
3. Replace the original file with the documented version.

This tool is designed for teaching and learning: students keep control of their own API keys and can use free-tier access from OpenRouter, Groq, or any OpenAI-compatible provider.

---

## Features

- **Context menu integration**
  - Right–click in the **editor** on a Java file.
  - Or right–click a `.java` file in the **Explorer**.
  - Choose **"Generate Javadoc for File"**.
- **Toolbar button**
  - Click the button in the top-right corner of the editor when a Java file is open.
- **Automatic Javadoc generation**
  - Javadoc for:
    - Public classes, interfaces, enums
    - Public and protected methods & constructors
    - Important fields where helpful
- **Non-destructive behaviour (by design of prompt)**
  - The extension asks the model **not to rename or remove** classes, methods, or fields.
- **Provider-agnostic**
  - Defaults to Groq.
  - Can be pointed at any OpenAI-compatible endpoint (OpenAI, OpenRouter, etc.) via settings.

---

## Requirements

- **Visual Studio Code** `^1.106.1`
- **Internet connection**
- **OpenAI-compatible API key**
  - Recommended: free-tier key from [OpenRouter](https://openrouter.ai/keys) (defaults ship with their endpoints/models).
  - You can point the extension at Groq or any other OpenAI-compatible host.

---

## First-time setup
1. Launch the command palette and run **KU Javadoc: Open Setup** (also available from the `Get Started` walkthrough card).
2. Enter the author name you want to appear in the `@author` tag.
3. Paste your OpenRouter (or other provider) API key.
4. Keep the default endpoint/model, or adjust them if you prefer another host.
5. Press **Save settings**.

You can reopen the setup panel at any time via the same command.

To verify everything, right–click a Java file and choose **"Generate Javadoc for File"**. If configuration is complete, the extension will process the file and add Javadoc comments.

---

## Extension Settings
This extension contributes the following settings:
* `ku-javadoc.apiKey`: Your API key for the AI provider (e.g., OpenRouter or Groq).
* `ku-javadoc.endpoint`: The API endpoint URL for the provider (defaults to OpenRouter-compatible Groq endpoint).
* `ku-javadoc.model`: The model name to use for generating Javadoc (default is OpenRouter's `llama-3.1-8b-instant`).
* `ku-javadoc.name`: Optional author name inserted into generated comments.
