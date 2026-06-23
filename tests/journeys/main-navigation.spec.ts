import { test, expect } from '@playwright/test';
import {
  navigationRoutes,
  startUrl,
} from '../data/navigation.routes';

test.describe('primary navigation', () => {
  for (const route of navigationRoutes) {
    test(`opens the ${route.linkName} page`, async ({ page }) => {
      await page.goto(startUrl);
      await page
        .locator('#navigation')
        .getByRole('link', { name: route.linkName, exact: true })
        .click();

      await expect(page).toHaveURL(route.expectedUrl);
      await expect(
        page.getByRole('heading', {
          name: route.expectedHeading,
          exact: true,
        }),
      ).toBeVisible();
    });
  }
});
