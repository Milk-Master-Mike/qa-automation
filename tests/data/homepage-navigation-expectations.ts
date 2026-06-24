export type NavigationExpectation = {
  heading?: RegExp;
};

// Human-reviewed expectations belong here, separate from generated discovery data.
export const navigationExpectations: Record<
  string,
  NavigationExpectation
> = {
  '/abtest': {
    heading: /^A\/B Test/,
  },
};
