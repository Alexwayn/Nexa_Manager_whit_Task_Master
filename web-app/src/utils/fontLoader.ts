// Font loading optimization utility for Manrope
export const preloadFonts = (): void => {
  const fonts: string[] = [
    'Manrope:wght@200;300;400;500;600;700;800'
  ];

  fonts.forEach((font: string) => {
    const link: HTMLLinkElement = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = `https://fonts.googleapis.com/css2?family=${font}&display=swap`;
    document.head.appendChild(link);
  });
};

// Font display optimization for better performance
export const optimizeFontDisplay = (): void => {
  const style: HTMLStyleElement = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Manrope';
      font-display: swap;
      font-weight: 200 800;
      src: url('https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk59FO_F87jxeN7B.woff2') format('woff2');
    }
  `;
  document.head.appendChild(style);
};

// Initialize font loading with performance optimizations
export const initFontLoading = (): void => {
  // Preload critical fonts
  preloadFonts();
  
  // Optimize font display
  optimizeFontDisplay();
  
  // Add font loading class to body for progressive enhancement
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.body.classList.add('fonts-loaded');
    });
  }
}; 