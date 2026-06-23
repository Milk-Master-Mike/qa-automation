import { test, expect } from '@playwright/test';
import { specialLinks } from '../data/special-links';
import {
  goToRepresentativeSourcePage,
  resolveVisibleLink,
  tagSelfHealedResolution,
} from './link-utils';

test.describe('special links', () => {
  for (const [index, route] of specialLinks.entries()) {
    test(`handles ${route.category} link ${index + 1}: ${route.names[0]}`, async ({ page }, testInfo) => {
      await goToRepresentativeSourcePage(page, route.sourcePages);

      const isPayPalCheckoutForm =
        route.category === 'Payment' &&
        route.href === 'https://www.paypal.com/cgi-bin/webscr';

      if (isPayPalCheckoutForm) {
        const form = page.locator(`form[action="${route.href}"]`).first();

        await expect(form).toBeVisible();
        await expect(form).toHaveAttribute('method', 'post');
        await expect(form).toHaveAttribute('target', '_new');
        await expect(form.locator('input[name="cmd"]')).toHaveCount(1);
        await expect(form.locator('input[name="hosted_button_id"]')).toHaveCount(1);
      } else {
        const resolution = await resolveVisibleLink(page, route.names, route.href);

        tagSelfHealedResolution(testInfo, resolution);

        await expect(resolution.locator).toBeVisible();
        await expect(resolution.locator).toHaveAttribute('href', route.href);
      }
    });
  }
});
