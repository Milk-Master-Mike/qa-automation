import {
  type Locator,
  type Page,
  type TestInfo,
} from '@playwright/test';

export type LinkResolution = {
  locator: Locator;
  resolvedBy: 'role-name' | 'href-fallback';
  attemptedNames: readonly string[];
  href: string;
  matchedName?: string;
};

export async function goToRepresentativeSourcePage(
  page: Page,
  sourcePages: readonly string[],
) {
  const [sourcePage] = sourcePages;

  if (!sourcePage) {
    throw new Error('Expected at least one source page.');
  }

  await page.goto(sourcePage);
}

export async function resolveVisibleLink(
  page: Page,
  names: readonly string[],
  href: string,
): Promise<LinkResolution> {
  const attemptedNames = names.filter((name) => name !== '(unnamed link)');

  for (const name of attemptedNames) {
    const roleLocator = page.getByRole('link', { name, exact: true });
    const visibleMatch = await findFirstVisibleCandidate(roleLocator);

    if (visibleMatch) {
      return {
        locator: visibleMatch,
        resolvedBy: 'role-name',
        attemptedNames,
        href,
        matchedName: name,
      };
    }
  }

  const hrefLocator = page.locator(`a[href="${href}"]`);

  const visibleHrefMatch = await findFirstVisibleCandidate(hrefLocator);

  if (visibleHrefMatch) {
    return {
      locator: visibleHrefMatch,
      resolvedBy: 'href-fallback',
      attemptedNames,
      href,
    };
  }

  throw new Error(
    [
      `Unable to resolve a visible link for ${href}.`,
      attemptedNames.length > 0
        ? `Tried role/name matches: ${attemptedNames.join(' | ')}.`
        : 'No usable role/name matches were provided.',
      'No visible href match was found either.',
    ].join(' '),
  );
}

export function tagSelfHealedResolution(
  testInfo: TestInfo,
  resolution: LinkResolution,
) {
  if (resolution.resolvedBy !== 'href-fallback') {
    return;
  }

  testInfo.annotations.push({
    type: 'self-healed',
    description: `Fell back to href lookup for ${resolution.href} after role/name lookup missed ${resolution.attemptedNames.join(' | ') || '(no names)'}.`,
  });
}

async function findFirstVisibleCandidate(locator: Locator): Promise<Locator | null> {
  const count = await locator.count();

  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);

    if (await candidate.isVisible()) {
      return candidate;
    }
  }

  return null;
}
