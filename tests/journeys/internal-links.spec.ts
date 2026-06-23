import { test, expect } from '@playwright/test';
import { internalLinks } from '../data/internal-links';
import {
  goToRepresentativeSourcePage,
  resolveVisibleLink,
  tagSelfHealedResolution,
} from './link-utils';

test.describe('internal links', () => {
  for (const route of internalLinks) {
    test(`navigates ${route.names[0]} to ${route.href}`, async ({ page }, testInfo) => {
      await goToRepresentativeSourcePage(page, route.sourcePages);

      const resolution = await resolveVisibleLink(page, route.names, route.href);

      tagSelfHealedResolution(testInfo, resolution);

      await expect(resolution.locator).toBeVisible();
      await resolution.locator.click();
      await expect(page).toHaveURL(route.href);
    });
  }
});
