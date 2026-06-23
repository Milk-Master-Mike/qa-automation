import { test, expect } from '@playwright/test';
import { externalLinks } from '../data/external-links';
import {
  goToRepresentativeSourcePage,
  resolveVisibleLink,
  tagSelfHealedResolution,
} from './link-utils';

test.describe('external links', () => {
  for (const route of externalLinks) {
    test(`exposes ${route.names[0]} as ${route.href}`, async ({ page }, testInfo) => {
      await goToRepresentativeSourcePage(page, route.sourcePages);

      const resolution = await resolveVisibleLink(page, route.names, route.href);

      tagSelfHealedResolution(testInfo, resolution);

      await expect(resolution.locator).toBeVisible();
      await expect(resolution.locator).toHaveAttribute('href', route.href);
    });
  }
});
