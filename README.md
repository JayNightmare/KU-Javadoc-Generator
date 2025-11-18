<div align="center">
  <h1>KU Javadoc – VS Code Extension</h1>
  <p>
    <a href="https://marketplace.visualstudio.com/items?itemName=jaynightmare.ku-javadoc">
      <img src="https://img.shields.io/visual-studio-marketplace/v/jaynightmare.ku-javadoc?label=VS%20Code%20Marketplace&style=flat-square" alt="VS Code Marketplace" />
    </a>
    </p>
</div>

# Kingston University (KU) Javadoc – VS Code Extension

KU Javadoc is a Visual Studio Code extension that generates Javadoc comments for Java files using an AI model.

Right–click any `.java` file (or press the icon on the toolbar), choose **"Generate Javadoc for File"**, and the extension will:

1. Send the file contents to an AI model.
2. Insert appropriate Javadoc comments into the code.
3. Replace the original file with the documented version.

This tool is designed for teaching and learning: students keep control of their own API keys and can use free-tier access from Groq.

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
- **Groq API key**
  - Free-tier account from [Groq Console](https://console.groq.com/) (or whichever provider you choose).
  - A model name that the provider supports (default is a Groq model).

---

## Installation Process
1. Open Visual Studio Code.
2. Go to the Settings (Top Right > Cog Icon > Settings).
3. Search for "KU Javadoc" in the Settings search bar.
4. Locate the "KU Javadoc: Api Key" field.
   - Go to [Groq Console](https://console.groq.com/keys) to sign up for a free account if you don't have one.
   - Navigate to the API Keys section in the Groq Console.
   - Create a new API key and copy it.
5. Paste the copied API key into the "KU Javadoc: Api Key" field in VS Code.

To see if it's working, right–click a Java file and choose **"Generate Javadoc for File"**. If everything is set up correctly, the extension will process the file and add Javadoc comments. 

---

## Extension Settings
This extension contributes the following settings:
* `ku-javadoc.apiKey`: Your API key for the AI provider (e.g., Groq).
* `ku-javadoc.apiEndpoint`: The API endpoint URL for the AI provider (default is Groq's endpoint).
* `ku-javadoc.model`: The model name to use for generating Javadoc (default is a Groq model).