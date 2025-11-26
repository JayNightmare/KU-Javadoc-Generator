# Change Log

All notable changes to the "ku-javadoc" extension will be documented in this file.

## [0.0.6] - 19/11/2025
- Added "Documentation Site" feature:
  - Supports both Maven and non-Maven Java projects.
  - Configures `pom.xml` for Maven projects with `maven-site-plugin` and `maven-javadoc-plugin`.
  - Generates GitHub Actions workflow (`.github/workflows/doc-site.yml`) for automated deployment to GitHub Pages.
  - Updates `README.md` with instructions on how to generate and deploy the site.
  - New commands: `ku-javadoc.configureSite` and `ku-javadoc.generateSite`.

## [0.0.5] - 19/11/2025
- Added "KU Javadoc: Open Setup" walkthrough entry and welcome view so new users can find the guided experience.
- Introduced onboarding webview with validation for name, API key, endpoint, and model plus quick link to OpenRouter keys.
- Extension now prompts to open the setup panel when no API key is configured and offers the same action from Javadoc generation errors.
- README updated with the first-time setup instructions reflecting the new workflow.

## [0.0.4] - 18/11/2025
- Fixed issue with Javadoc generation for methods with complex parameters.
- Improved performance of Javadoc generation.
- Added name for @author tag in generated comments in the settings.
- UI Improvements:
  - Added loading indicator while generating Javadoc comments.
  - Added first-run guided setup command and walkthrough to collect name, API key, endpoint, and model.

- Plan Update:
  - First installation experience panel to set up author name and API key.

## [0.0.3] - 18/11/2025
- Added toolbar button for generating Javadoc comments.
- Updated README.
- Improved prompt design to prevent renaming or removing code elements.
- Fixed minor bugs related to API endpoint configuration.
- Restuructured code for better maintainability.

## [Unreleased]

- Initial release