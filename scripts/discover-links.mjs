import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const startUrl =
  'https://www.southernknightscruisers.com/index.html';

const currentFile = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(currentFile);
const projectRoot = path.resolve(scriptsDirectory, '..');
const outputDirectory = path.join(projectRoot, 'tests', 'data');

const normalize = value => (value ?? '').replace(/\s+/g, ' ').trim();

const createId = value =>
  normalize(value)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const uniqueByHref = links => [
  ...new Map(links.map(link => [link.href, link])).values(),
];

async function waitForSharedComponents(page) {
  await page
    .locator('#navigation a[href]')
    .first()
    .waitFor({ state: 'attached', timeout: 15_000 });

  await page
    .locator('#footer a[href]')
    .first()
    .waitFor({ state: 'attached', timeout: 15_000 });
}

async function extractLinks(page) {
  return page.locator('a[href]').evaluateAll(
    (links, sourcePage) =>
      links.map(link => {
        const rawHref = link.getAttribute('href') ?? '';
        const url = new URL(rawHref, window.location.href);
        const insideNavigation = Boolean(link.closest('#navigation'));
        const visible = link.getClientRects().length > 0;
        const name =
          link.textContent?.replace(/\s+/g, ' ').trim() ||
          link.getAttribute('aria-label') ||
          link.querySelector('img')?.getAttribute('alt') ||
          '(unnamed link)';

        let category;

        if (insideNavigation && visible) {
          category = 'Primary navigation';
        } else if (insideNavigation) {
          category = 'Hidden/dropdown navigation';
        } else if (rawHref === '#') {
          category = 'Placeholder/broken';
        } else if (rawHref.startsWith('mailto:')) {
          category = 'Email';
        } else if (url.pathname.toLowerCase().endsWith('.pdf')) {
          category = 'PDF';
        } else if (url.hostname.includes('paypal')) {
          category = 'Payment';
        } else if (url.origin === window.location.origin) {
          category = 'Internal content';
        } else {
          category = 'External';
        }

        return {
          name,
          rawHref,
          href: url.href,
          category,
          visible,
          sourcePage,
          elementType: 'link',
        };
      }),
    page.url(),
  );
}

async function extractPaymentForms(page) {
  return page.locator('form[action]').evaluateAll(
    (forms, sourcePage) =>
      forms
        .map(form => {
          const rawAction = form.getAttribute('action') ?? '';
          const action = new URL(rawAction, window.location.href);
          const submitControl = form.querySelector(
            'button[type="submit"], input[type="submit"], input[type="image"]',
          );

          return {
            name:
              submitControl?.getAttribute('aria-label') ||
              submitControl?.getAttribute('alt') ||
              submitControl?.getAttribute('title') ||
              'Payment form',
            href: action.href,
            category: action.hostname.includes('paypal')
              ? 'Payment'
              : 'Form action',
            visible: form.getClientRects().length > 0,
            sourcePage,
            elementType: 'form',
            method: (form.getAttribute('method') || 'get').toUpperCase(),
          };
        })
        .filter(form => form.category === 'Payment'),
    page.url(),
  );
}

async function extractHeadings(page) {
  return (await page.locator('h1').allTextContents())
    .map(normalize)
    .filter(Boolean);
}

function isScannableInternalPage(link) {
  if (link.category === 'Placeholder/broken') return false;

  const url = new URL(link.href);
  const startOrigin = new URL(startUrl).origin;

  if (url.origin !== startOrigin) return false;

  return !/\.(?:pdf|jpe?g|png|gif|svg|webp|zip)$/i.test(url.pathname);
}

function createRoute(candidate, headings, triggerName) {
  const normalizedName = normalize(candidate.name).toLowerCase();
  const expectedHeading =
    headings.find(heading =>
      heading.toLowerCase().includes(normalizedName),
    ) ??
    headings.at(-1) ??
    '';

  if (!expectedHeading) {
    console.warn(`Skipping ${candidate.name}: no h1 heading found.`);
    return undefined;
  }

  const destination = new URL(candidate.href);

  return {
    id: createId(candidate.name),
    ...(triggerName ? { triggerName } : {}),
    linkName: normalize(candidate.name),
    href:
      destination.pathname.replace(/^\/+/, '') +
      destination.search +
      destination.hash,
    expectedUrl: destination.href,
    expectedHeading,
  };
}

function aggregateLinks(records, categories) {
  const grouped = new Map();

  for (const record of records) {
    if (!categories.includes(record.category)) continue;

    const key = `${record.category}|${record.elementType}|${record.href}`;
    const existing = grouped.get(key) ?? {
      category: record.category,
      href: record.href,
      names: new Set(),
      sourcePages: new Set(),
      elementTypes: new Set(),
      methods: new Set(),
    };

    existing.names.add(normalize(record.name));
    existing.sourcePages.add(record.sourcePage);
    existing.elementTypes.add(record.elementType);
    if (record.method) existing.methods.add(record.method);
    grouped.set(key, existing);
  }

  return [...grouped.values()].map(entry => ({
    category: entry.category,
    names: [...entry.names],
    href: entry.href,
    sourcePages: [...entry.sourcePages],
    elementTypes: [...entry.elementTypes],
    ...(entry.methods.size ? { methods: [...entry.methods] } : {}),
  }));
}

async function writeDataFile(fileName, exportName, data, typeName) {
  const contents = `// Generated by scripts/discover-links.mjs.\n// Review changes before committing them as test expectations.\n\nexport const ${exportName} = ${JSON.stringify(data, null, 2)} as const;\n\nexport type ${typeName} =\n  (typeof ${exportName})[number];\n`;

  await writeFile(
    path.join(outputDirectory, fileName),
    contents,
    'utf8',
  );
}

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();

  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
  await waitForSharedComponents(page);

  const homepageLinks = await extractLinks(page);
  const homepageForms = await extractPaymentForms(page);

  const primaryCandidates = uniqueByHref(
    homepageLinks.filter(link => link.category === 'Primary navigation'),
  );
  const primaryUrls = new Set(primaryCandidates.map(link => link.href));
  const dropdownCandidates = uniqueByHref(
    homepageLinks.filter(
      link =>
        link.category === 'Hidden/dropdown navigation' &&
        !primaryUrls.has(link.href),
    ),
  );

  const pagesToScan = uniqueByHref(
    homepageLinks.filter(isScannableInternalPage),
  ).map(link => link.href);

  const allLinks = [...homepageLinks];
  const allForms = [...homepageForms];
  const headingsByUrl = new Map([
    [startUrl, await extractHeadings(page)],
  ]);

  for (const pageUrl of pagesToScan) {
    if (pageUrl === startUrl) continue;

    try {
      const response = await page.goto(pageUrl, {
        waitUntil: 'domcontentloaded',
      });

      if (response && !response.ok()) {
        console.warn(`Skipping ${pageUrl}: HTTP ${response.status()}`);
        continue;
      }

      await waitForSharedComponents(page);
      headingsByUrl.set(pageUrl, await extractHeadings(page));
      allLinks.push(...(await extractLinks(page)));
      allForms.push(...(await extractPaymentForms(page)));
    } catch (error) {
      console.warn(`Skipping ${pageUrl}: ${error.message}`);
    }
  }

  const navigationRoutes = primaryCandidates
    .map(candidate =>
      createRoute(candidate, headingsByUrl.get(candidate.href) ?? []),
    )
    .filter(Boolean);

  const dropdownRoutes = dropdownCandidates
    .map(candidate =>
      createRoute(
        candidate,
        headingsByUrl.get(candidate.href) ?? [],
        'Car Show',
      ),
    )
    .filter(Boolean);

  const internalLinks = aggregateLinks(allLinks, ['Internal content']);
  const externalLinks = aggregateLinks(allLinks, ['External']);
  const specialLinks = aggregateLinks([...allLinks, ...allForms], [
    'Email',
    'PDF',
    'Payment',
    'Placeholder/broken',
  ]);

  const navigationContents = `// Generated by scripts/discover-links.mjs.\n// Review changes before committing them as test expectations.\n\nexport const startUrl = ${JSON.stringify(startUrl)};\n\nexport const navigationRoutes = ${JSON.stringify(navigationRoutes, null, 2)} as const;\n\nexport type NavigationRoute =\n  (typeof navigationRoutes)[number];\n`;

  await writeFile(
    path.join(outputDirectory, 'navigation.routes.ts'),
    navigationContents,
    'utf8',
  );
  await writeDataFile(
    'dropdown.routes.ts',
    'dropdownRoutes',
    dropdownRoutes,
    'DropdownRoute',
  );
  await writeDataFile(
    'internal-links.ts',
    'internalLinks',
    internalLinks,
    'InternalLink',
  );
  await writeDataFile(
    'external-links.ts',
    'externalLinks',
    externalLinks,
    'ExternalLink',
  );
  await writeDataFile(
    'special-links.ts',
    'specialLinks',
    specialLinks,
    'SpecialLink',
  );

  console.log(`Primary routes: ${navigationRoutes.length}`);
  console.log(`Dropdown routes: ${dropdownRoutes.length}`);
  console.log(`Internal destinations: ${internalLinks.length}`);
  console.log(`External destinations: ${externalLinks.length}`);
  console.log(`Special destinations: ${specialLinks.length}`);
  console.log(`Wrote data files to ${outputDirectory}`);
} finally {
  await browser.close();
}
