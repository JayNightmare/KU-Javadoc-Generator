import * as vscode from "vscode";
import * as path from "path";
import generateJavadocCommand from "./generateCommand.js";

const MAVEN_SITE_PLUGIN_XML = `
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-site-plugin</artifactId>
                <version>3.12.1</version>
            </plugin>`;

const MAVEN_JAVADOC_PLUGIN_XML = `
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-javadoc-plugin</artifactId>
                <version>3.6.3</version>
                <configuration>
                    <show>private</show>
                    <nohelp>true</nohelp>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-project-info-reports-plugin</artifactId>
                <version>3.5.0</version>
            </plugin>`;

export async function configureSiteCommand() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const pomPath = path.join(rootPath, "pom.xml");

    let isMaven = false;
    try {
        await vscode.workspace.fs.stat(vscode.Uri.file(pomPath));
        isMaven = true;
    } catch {
        isMaven = false;
    }

    if (isMaven) {
        await configureMavenProject(rootPath, pomPath);
    } else {
        await configureSimpleProject(rootPath);
    }
}

export async function generateSiteCommand() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const pomPath = path.join(rootPath, "pom.xml");

    let isMaven = false;
    try {
        await vscode.workspace.fs.stat(vscode.Uri.file(pomPath));
        isMaven = true;
    } catch {
        isMaven = false;
    }

    const terminal = vscode.window.createTerminal("Doc Site Generator");
    terminal.show();

    if (isMaven) {
        terminal.sendText("mvn site");
    } else {
        // Simple Javadoc generation
        // To be robust across OSes and project structures, we find all .java files
        // and pass them to javadoc via an options file (@file).

        const srcPath = path.join(rootPath, "src");
        let hasSrc = false;
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(srcPath));
            hasSrc = true;
        } catch {
            // src doesn't exist
        }

        let javaFiles = [];
        if (hasSrc) {
            // Find all java files in src
            javaFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(rootPath, "src/**/*.java")
            );
        } else {
            // Find in root, but exclude typical non-source folders
            javaFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(rootPath, "*.java"),
                "**/{node_modules,docs,target,bin,build,.git}/**"
            );
        }

        if (javaFiles.length === 0) {
            vscode.window.showErrorMessage(
                "No Java files found to generate documentation for."
            );
            return;
        }

        // Filter out files with errors
        const validJavaFiles = [];
        const skippedFiles = [];

        for (const fileUri of javaFiles) {
            const diagnostics = vscode.languages.getDiagnostics(fileUri);
            const hasError = diagnostics.some(
                (d) => d.severity === vscode.DiagnosticSeverity.Error
            );
            if (hasError) {
                skippedFiles.push(path.basename(fileUri.fsPath));
            } else {
                validJavaFiles.push(fileUri);
            }
        }

        if (skippedFiles.length > 0) {
            vscode.window.showWarningMessage(
                `Skipped ${
                    skippedFiles.length
                } file(s) due to errors: ${skippedFiles.join(", ")}`
            );
        }

        if (validJavaFiles.length === 0) {
            vscode.window.showErrorMessage(
                "No valid Java files found to generate documentation for."
            );
            return;
        }

        // Ask user if they want to generate docs for all files
        const selection = await vscode.window.showInformationMessage(
            `Found ${validJavaFiles.length} valid Java files. Do you want to generate Javadoc for them using AI before creating the site?`,
            "Yes, generate docs",
            "No, just site"
        );

        if (selection === "Yes, generate docs") {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: "Generating Javadoc for files...",
                    cancellable: true,
                },
                async (progress, token) => {
                    const total = validJavaFiles.length;
                    for (let i = 0; i < total; i++) {
                        if (token.isCancellationRequested) {
                            break;
                        }
                        const fileUri = validJavaFiles[i];
                        progress.report({
                            message: `${path.basename(fileUri.fsPath)} (${
                                i + 1
                            }/${total})`,
                            increment: 100 / total,
                        });
                        // Pass true for silent mode
                        await generateJavadocCommand(fileUri, true);
                    }
                }
            );
        }

        // Create options file listing all source files
        // We use relative paths and quote them to handle spaces
        // IMPORTANT: Use forward slashes even on Windows to avoid javadoc interpreting backslashes as escapes
        const sourcesList = validJavaFiles
            .map((uri) => path.relative(rootPath, uri.fsPath))
            .map((p) => p.split(path.sep).join(path.posix.sep))
            .map((p) => `"${p}"`)
            .join("\n");

        const optionsFilePath = path.join(rootPath, "javadoc-options.txt");
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(optionsFilePath),
            Buffer.from(sourcesList, "utf8")
        );

        // Run javadoc using the options file
        // We also need to specify sourcepath so javadoc can find referenced classes
        // that might not be in the list (or to correctly resolve packages)
        const sourcePathArg = hasSrc ? "-sourcepath src" : "-sourcepath .";
        // Add flags for comprehensive docs: -private (show all), -author, -version, -linksource
        const extraFlags = "-private -author -version -linksource";
        terminal.sendText(
            `javadoc -d docs ${sourcePathArg} ${extraFlags} @javadoc-options.txt`
        );

        vscode.window.showInformationMessage(
            "Generated 'javadoc-options.txt' with source files and started Javadoc generation."
        );
    }
}

async function configureMavenProject(rootPath, pomPath) {
    // Read pom.xml
    const pomUri = vscode.Uri.file(pomPath);
    const pomData = await vscode.workspace.fs.readFile(pomUri);
    let pomContent = Buffer.from(pomData).toString("utf8");
    let originalContent = pomContent;

    // 1. Add maven-site-plugin to <build> if missing
    if (!pomContent.includes("maven-site-plugin")) {
        if (/<build>\s*<plugins>/.test(pomContent)) {
            pomContent = pomContent.replace(
                /(<build>\s*<plugins>)/,
                `$1${MAVEN_SITE_PLUGIN_XML}`
            );
        } else if (/<build>/.test(pomContent)) {
            pomContent = pomContent.replace(
                /(<build>)/,
                `$1\n        <plugins>${MAVEN_SITE_PLUGIN_XML}\n        </plugins>`
            );
        } else {
            pomContent = pomContent.replace(
                "</project>",
                `    <build>
        <plugins>${MAVEN_SITE_PLUGIN_XML}
        </plugins>
    </build>
</project>`
            );
        }
    }

    // 2. Add maven-javadoc-plugin to <reporting> if missing
    if (!pomContent.includes("maven-javadoc-plugin")) {
        if (/<reporting>\s*<plugins>/.test(pomContent)) {
            pomContent = pomContent.replace(
                /(<reporting>\s*<plugins>)/,
                `$1${MAVEN_JAVADOC_PLUGIN_XML}`
            );
        } else if (/<reporting>/.test(pomContent)) {
            pomContent = pomContent.replace(
                /(<reporting>)/,
                `$1\n        <plugins>${MAVEN_JAVADOC_PLUGIN_XML}\n        </plugins>`
            );
        } else {
            pomContent = pomContent.replace(
                "</project>",
                `    <reporting>
        <plugins>${MAVEN_JAVADOC_PLUGIN_XML}
        </plugins>
    </reporting>
</project>`
            );
        }
    }

    if (pomContent !== originalContent) {
        await vscode.workspace.fs.writeFile(
            pomUri,
            Buffer.from(pomContent, "utf8")
        );
        vscode.window.showInformationMessage(
            "Updated pom.xml with Maven Site and Javadoc plugins."
        );
    } else {
        vscode.window.showInformationMessage(
            "pom.xml already appears to have necessary plugins."
        );
    }

    // 3. Create GitHub Actions Workflow
    await createWorkflowFile(rootPath, true);

    // 4. Update README.md
    await updateReadme(rootPath, true);
}

async function configureSimpleProject(rootPath) {
    // 1. Create GitHub Actions Workflow
    await createWorkflowFile(rootPath, false);

    // 2. Update README.md
    await updateReadme(rootPath, false);

    vscode.window.showInformationMessage(
        "Configured simple Javadoc site generation."
    );
}

async function createWorkflowFile(rootPath, isMaven) {
    const workflowsDir = path.join(rootPath, ".github", "workflows");
    const workflowFile = path.join(workflowsDir, "doc-site.yml");

    try {
        await vscode.workspace.fs.createDirectory(
            vscode.Uri.file(workflowsDir)
        );

        let workflowContent = "";

        if (isMaven) {
            workflowContent = `name: Generate Documentation Site

on:
  push:
    branches: [ "master", "main" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: maven

    - name: Build Site
      run: mvn site

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./target/site
`;
        } else {
            workflowContent = `name: Generate Documentation Site

on:
  push:
    branches: [ "master", "main" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Generate Javadoc
      run: |
        mkdir -p docs
        # Try to generate javadoc for src folder if it exists, else current dir
        if [ -d "src" ]; then
          javadoc -d docs -sourcepath src -subpackages . || javadoc -d docs src/*.java
        else
          javadoc -d docs *.java
        fi

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./docs
`;
        }

        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(workflowFile),
            Buffer.from(workflowContent, "utf8")
        );
        vscode.window.showInformationMessage(
            "Created GitHub Actions workflow for Documentation Site."
        );
    } catch (e) {
        vscode.window.showErrorMessage(
            "Failed to create workflow file: " + e.message
        );
    }
}

async function updateReadme(rootPath, isMaven) {
    const readmePath = path.join(rootPath, "README.md");
    const readmeUri = vscode.Uri.file(readmePath);
    let readmeContent = "";
    try {
        const readmeData = await vscode.workspace.fs.readFile(readmeUri);
        readmeContent = Buffer.from(readmeData).toString("utf8");
    } catch {
        readmeContent = "# Project Documentation\n\n";
    }

    if (!readmeContent.includes("## Documentation Site")) {
        let docSection = "";

        if (isMaven) {
            docSection = `
## Documentation Site

This project is configured to generate a Maven Site with Javadoc.

### Generating the Site Locally

To generate the site locally, run:

\`\`\`bash
mvn site
\`\`\`

The generated site will be available in \`target/site/index.html\`.
`;
        } else {
            docSection = `
## Documentation Site

This project is configured to generate a Javadoc site.

### Generating the Site Locally

To generate the site locally, use the VS Code command **"KU Javadoc: Generate Documentation Site"**.

Alternatively, you can run Javadoc manually. For example:

\`\`\`bash
# Generate a list of sources (Linux/Mac)
find src -name "*.java" > sources.txt
javadoc -d docs @sources.txt

# Windows (CMD)
dir /s /b src\\*.java > sources.txt
javadoc -d docs @sources.txt
\`\`\`

The generated site will be available in \`docs/index.html\`.
`;
        }

        docSection += `
### GitHub Pages Deployment

A GitHub Actions workflow is configured in \`.github/workflows/doc-site.yml\` to automatically build and deploy the site to GitHub Pages on push to the main branch.
`;
        readmeContent += docSection;
        await vscode.workspace.fs.writeFile(
            readmeUri,
            Buffer.from(readmeContent, "utf8")
        );
        vscode.window.showInformationMessage(
            "Updated README.md with Documentation Site instructions."
        );
    }
}
