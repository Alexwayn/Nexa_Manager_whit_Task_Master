/**
 * Basic test to verify voice test setup is working
 */

describe('Voice Test Setup', () => {
  test('should have access to voice test utilities', () => {
    // This test verifies that our test setup is working correctly
    expect(global.SpeechRecognition).toBeDefined();
    expect(global.speechSynthesis).toBeDefined();
    expect(global.navigator.mediaDevices).toBeDefined();
    expect(global.navigator.permissions).toBeDefined();
  });

  test('should have localStorage mock', () => {
    expect(global.localStorage).toBeDefined();
    expect(typeof global.localStorage.getItem).toBe('function');
    expect(typeof global.localStorage.setItem).toBe('function');
  });

  test('should have AudioContext mock', () => {
    expect(global.AudioContext).toBeDefined();
    expect(global.webkitAudioContext).toBeDefined();
  });
});
