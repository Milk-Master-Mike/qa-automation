import { test, expect } from '@playwright/test';
import { homepageNavigation } from '../data/homepage-navigation';
import { getVerifiedHomepageLink } from './navigation-helpers';

const externalNavigation = homepageNavigation.filter(
  (link) => link.testType === 'external',
);

test.describe('external homepage navigation contracts', () => {
  for (const link of externalNavigation) {
    test(`${link.number}. ${link.name} exposes its external destination`, async ({
      page,
    }) => {
      const navigationLink = await getVerifiedHomepageLink(page, link, {
        requireVisible: false,
      });

      await expect(navigationLink).toHaveAttribute('href', link.expectedUrl);

      if (link.name === 'Fork me on GitHub') {
        await expect(
          page.getByRole('img', { name: link.name, exact: true }),
        ).toBeVisible();
      } else {
        await expect(navigationLink).toBeVisible();
      }

      if (link.opensNewTab) {
        await expect(navigationLink).toHaveAttribute('target', '_blank');
      } else {
        await expect(navigationLink).not.toHaveAttribute('target', '_blank');
      }
    });
  }
});
