import { test, expect } from '@playwright/test';
import { homepageNavigation } from '../data/homepage-navigation';
import { navigationExpectations } from '../data/homepage-navigation-expectations';
import {
  clickAndWaitForNavigation,
  exactTextPattern,
  getVerifiedHomepageLink,
} from './navigation-helpers';

const standardNavigation = homepageNavigation.filter(
  (link) => link.testType === 'standard',
);

test.describe('standard homepage navigation', () => {
  for (const link of standardNavigation) {
    test(`${link.number}. ${link.name} opens ${link.path}`, async ({ page }) => {
      expect(
        link.destination.discoveryStatus,
        `Discovery must successfully inspect ${link.path}.`,
      ).toBe('visited');

      const discoveredHeading = link.destination.headings.find(
        (heading) => heading.isVisible,
      );

      expect(
        discoveredHeading,
        `Discovery must find a visible heading on ${link.path}.`,
      ).toBeDefined();

      const navigationLink = await getVerifiedHomepageLink(page, link);
      await clickAndWaitForNavigation(
        page,
        navigationLink,
        link.destination.finalUrl!,
      );

      await expect(page).toHaveURL(link.destination.finalUrl!);

      const reviewedHeading = navigationExpectations[link.path]?.heading;
      const expectedHeading =
        reviewedHeading ?? exactTextPattern(discoveredHeading!.text);

      await expect(
        page.getByRole('heading', { name: expectedHeading }),
      ).toBeVisible();
    });
  }
});
