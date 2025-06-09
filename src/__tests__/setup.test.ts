describe('Setup', () => {
  test('Jest and TypeScript are working', () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(2, 3)).toBe(5);
  });

  test('Testing library is working', () => {
    expect(true).toBeTruthy();
  });
});
