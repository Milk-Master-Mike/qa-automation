import { test, expect } from '@playwright/test';
import {
  dropdownRoutes,
} from '../data/dropdown.routes';
import {
  startUrl,
} from '../data/navigation.routes';

function getDropdown(page: import('@playwright/test').Page, triggerName: string) {
  return page
    .locator('#navigation .dropdown')
    .filter({
      has: page.getByRole('link', { name: triggerName, exact: true }),
    })
    .first();
}

test.describe('dropdown navigation', () => {
  for (const route of dropdownRoutes) {
    test(`opens the ${route.linkName} page from the ${route.triggerName} menu`, async ({ page }) => {
      await page.goto(startUrl);

      const dropdown = getDropdown(page, route.triggerName);

      await dropdown.hover();
      await expect(dropdown.locator('.dropdown-content')).toBeVisible();

      await dropdown
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
