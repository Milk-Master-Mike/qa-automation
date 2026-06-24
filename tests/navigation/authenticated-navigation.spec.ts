import { test, expect } from '@playwright/test';
import { homepageNavigation } from '../data/homepage-navigation';
import {
  clickAndWaitForNavigation,
  getVerifiedHomepageLink,
} from './navigation-helpers';

const authenticatedNavigation = homepageNavigation.filter((link) =>
  ['basic-auth', 'digest-auth', 'secure-download'].includes(link.testType),
);

test.use({
  // These credentials are publicly documented by the practice website.
  httpCredentials: {
    username: 'admin',
    password: 'admin',
  },
});

test.describe('authenticated homepage navigation', () => {
  for (const link of authenticatedNavigation) {
    test(`${link.number}. ${link.name} opens with demo credentials`, async ({
      page,
    }) => {
      const navigationLink = await getVerifiedHomepageLink(page, link);
      await clickAndWaitForNavigation(page, navigationLink, link.expectedUrl);

      await expect(page).toHaveURL(link.expectedUrl);

      if (link.testType === 'secure-download') {
        await expect(
          page.getByRole('heading', { name: 'Secure File Downloader' }),
        ).toBeVisible();
      } else {
        await expect(page.getByText('Congratulations!')).toBeVisible();
      }
    });
  }
});
