# The Internet QA Automation Portfolio

This project is a Playwright test automation portfolio built against
[The Internet](https://the-internet.herokuapp.com/), a public website designed
for safe browser-automation practice.

> **Status:** Active build. Chromium navigation coverage is complete; cross-browser
> and feature-level behavior coverage are in progress.

The project begins with automated site discovery, converts the discovered
inventory into human-reviewed expectations, and assigns each feature the type
of test that matches its behavior. The end goal is 100% automated coverage of
the documented site inventory across Chromium, Firefox, and WebKit.

Designed and built by **Michael Weeks Jr.** to demonstrate test discovery,
human-reviewed expectations, resilient assertions, and responsible automation
against a public practice application.

## Current status

| Coverage area | Status |
| --- | --- |
| Homepage navigation points discovered | 46 of 46 |
| Chromium homepage navigation tests | 46 of 46 passing |
| External navigation contracts | 2 of 2 covered |
| Authenticated navigation routes | 3 of 3 covered |
| Special navigation behaviors | 3 of 3 covered |
| Firefox navigation coverage | Pending |
| WebKit navigation coverage | Pending |
| Full feature behavior coverage | In progress |

Current navigation coverage includes 38 standard internal destinations, two
external-link contracts, three authenticated destinations, and three special
routes covering a slow resource, an expected JavaScript error, and nested
frames.

## Coverage definition

This is a black-box testing project, so "100% coverage" means 100% of the
documented and discovered user-facing site inventory. It does not claim source
code statement or branch coverage because the application source is not part
of this repository.

A feature is considered fully covered when:

- Its route or entry point is present in the discovery inventory.
- Its navigation contract is tested.
- Its primary successful behavior is tested.
- Relevant negative, validation, and error behavior is tested.
- Its stable user-visible result is asserted.
- Browser-specific behavior is verified in Chromium, Firefox, and WebKit.
- Any intentional exclusion has a documented reason and a dedicated strategy.

## Project scope

The planned whole-site test inventory includes:

- Homepage navigation and external-link contracts.
- Basic, digest, and form authentication.
- Add/remove controls, checkboxes, dropdowns, inputs, and sliders.
- Dynamic content, dynamic controls, dynamic loading, and infinite scroll.
- JavaScript alerts, errors, context menus, and key presses.
- File upload, public download, and authenticated download behavior.
- Frames, nested frames, multiple windows, and the WYSIWYG editor.
- Hovers, floating menus, exit intent, entry ads, and geolocation.
- Broken images, disappearing elements, shifting content, and Shadow DOM.
- Redirects, notification messages, status codes, and slow resources.
- Sortable tables, large DOM structures, and content variants.
- Accessibility-focused checks for important interactive flows.

Load, stress, destructive, and security testing are outside this project's
scope. External websites are not opened during normal test runs; their link
contracts are validated from the practice site's homepage.

## Test architecture

The project separates machine discovery from human test judgment.

1. The discovery script opens the homepage and inventories every link.
2. Safe internal destinations are inspected once for status, final URL, title,
   and visible headings.
3. Each navigation point receives a behavior-specific `testType`.
4. Generated data is written to a TypeScript module under `tests/data`.
5. Human-reviewed patterns handle intentional variations such as the A/B test.
6. Playwright creates an independently reported test for every navigation point.

This separation prevents the discovery script from silently deciding what the
application should do. Generated evidence suggests assertions; reviewed test
expectations define the contract.

## Resilient assertions

Tests prefer semantic roles, accessible names, stable destinations, and
user-visible outcomes. For example, the A/B page can display either a control
or variation heading, so its reviewed expectation uses a stable pattern:

```ts
/^A\/B Test/
```

This accepts the documented content variants while still failing if the page
stops presenting itself as an A/B test. The suite does not silently replace a
failed locator with an unrelated element, because that could hide a real
regression.

## Project structure

```text
qa-automation/
|-- scripts/
|   `-- discovery/
|       `-- homepage-navigation.mjs
|-- tests/
|   |-- data/
|   |   |-- homepage-navigation.ts
|   |   `-- homepage-navigation-expectations.ts
|   `-- navigation/
|       |-- authenticated-navigation.spec.ts
|       |-- external-navigation.spec.ts
|       |-- navigation-helpers.ts
|       |-- special-navigation.spec.ts
|       `-- standard-navigation.spec.ts
|-- playwright.config.ts
|-- package.json
`-- README.md
```

## Run locally

Install dependencies and Playwright browsers:

```powershell
npm install
npx playwright install
```

Refresh the homepage navigation inventory:

```powershell
npm run discover:navigation
```

Run the verified Chromium navigation suite:

```powershell
npm run test:navigation:chromium
```

Run the navigation suite across every configured browser:

```powershell
npm run test:navigation
```

Playwright writes its HTML report to `playwright-report/`, which is excluded
from source control.

## Discovery output

Each generated navigation record includes:

- Homepage link number and accessible name.
- Raw `href`, resolved URL, and path.
- Internal or external classification.
- Visibility and new-tab behavior.
- Assigned test type.
- Destination discovery status.
- HTTP status and final URL after redirects.
- Page title and visible `h1` through `h6` headings.
- A reason when a destination is deliberately not visited.

Discovery is not run automatically before every test. The generated inventory
is reviewed and committed so unexpected site changes produce test failures
instead of silently rewriting the expected results.

## Roadmap

1. Verify all navigation tests in Firefox and WebKit.
2. Build positive and negative form-authentication journeys.
3. Cover inputs, controls, dropdowns, alerts, and dynamic behaviors.
4. Add upload and download fixtures that contain no personal data.
5. Add frame, window, editor, and Shadow DOM interaction tests.
6. Add status-code, redirect, JavaScript-error, and slow-resource assertions.
7. Add accessibility checks to critical user journeys.
8. Publish a final coverage matrix mapping every discovered feature to tests.

## AI-assisted development

This is an AI-assisted learning project. AI tools are used for pair programming,
debugging support, code review, and explaining unfamiliar concepts. Generated
suggestions are reviewed and tested before they are accepted into the project.

The project owner remains responsible for understanding the test strategy,
running and interpreting the tests, making scope decisions, and explaining the
implementation. The goal is to demonstrate practical QA judgment and growing
automation skill, not to present AI-generated work as unaided work.

## Safety and public-repository rules

- Only public demo credentials documented by the target site may appear here.
- Personal data, API tokens, private notes, and local environment files must not
  be committed.
- Tests use one worker to keep request volume low against the public service.
- The suite does not perform load testing or destructive actions.
- Upload tests must use generated fixtures rather than personal files.
- External destinations are validated without visiting third-party websites.
