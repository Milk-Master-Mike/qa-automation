import { test, expect } from '@playwright/test';
import { homepageNavigation } from '../data/homepage-navigation';
import {
  clickAndWaitForNavigation,
  getVerifiedHomepageLink,
} from './navigation-helpers';

function getNavigationByType(testType: string) {
  const link = homepageNavigation.find((candidate) => candidate.testType === testType);

  if (!link) {
    throw new Error(`Missing navigation discovery record for ${testType}.`);
  }

  return link;
}

test('slow-resource navigation reaches the DOM without waiting for the slow asset', async ({
  page,
}) => {
  const link = getNavigationByType('slow-resource');
  const navigationLink = await getVerifiedHomepageLink(page, link);
  await clickAndWaitForNavigation(page, navigationLink, link.expectedUrl);

  await expect(page).toHaveURL(link.expectedUrl);
  await expect(
    page.getByRole('heading', { name: 'Slow Resources' }),
  ).toBeVisible();
});

test('JavaScript-error navigation captures the expected page error', async ({
  page,
}) => {
  const link = getNavigationByType('javascript-error');
  const navigationLink = await getVerifiedHomepageLink(page, link);
  const pageErrorPromise = page.waitForEvent('pageerror');

  await clickAndWaitForNavigation(page, navigationLink, link.expectedUrl);

  await expect(page).toHaveURL(link.expectedUrl);

  const pageError = await pageErrorPromise;

  expect(pageError.message).toContain('xyz');
});

test('nested-frames navigation loads the expected frame structure', async ({
  page,
}) => {
  const link = getNavigationByType('nested-frames');
  const navigationLink = await getVerifiedHomepageLink(page, link);
  await clickAndWaitForNavigation(page, navigationLink, link.expectedUrl);

  await expect(page).toHaveURL(link.expectedUrl);

  const topFrame = page.frameLocator('frame[name="frame-top"]');

  await expect(
    topFrame.frameLocator('frame[name="frame-left"]').locator('body'),
  ).toContainText('LEFT');
  await expect(
    topFrame.frameLocator('frame[name="frame-middle"]').locator('body'),
  ).toContainText('MIDDLE');
  await expect(
    topFrame.frameLocator('frame[name="frame-right"]').locator('body'),
  ).toContainText('RIGHT');
  await expect(
    page.frameLocator('frame[name="frame-bottom"]').locator('body'),
  ).toContainText('BOTTOM');
});
