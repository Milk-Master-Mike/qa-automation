import { expect, type Locator, type Page } from '@playwright/test';
import {
  homepageUrl,
  type HomepageNavigationLink,
} from '../data/homepage-navigation';

export async function getVerifiedHomepageLink(
  page: Page,
  link: HomepageNavigationLink,
  options: { requireVisible?: boolean } = {},
) {
  await page.goto(homepageUrl, { waitUntil: 'commit' });

  const navigationLink = page.getByRole('link', {
    name: link.name,
    exact: true,
  });

  await expect(navigationLink).toHaveCount(1);

  if (options.requireVisible ?? true) {
    await expect(navigationLink).toBeVisible();
  }

  await expect(navigationLink).toHaveAttribute('href', link.rawHref);

  return navigationLink;
}

export async function clickAndWaitForNavigation(
  page: Page,
  navigationLink: Locator,
  expectedUrl: string,
) {
  const navigationReady = page.waitForURL(expectedUrl, {
    waitUntil: 'commit',
  });

  await navigationLink.evaluate((element: HTMLAnchorElement) => element.click());
  await navigationReady;
}

export function exactTextPattern(text: string) {
  const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escapedText}$`);
}
