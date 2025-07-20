// Font loading optimization utility for Plus Jakarta Sans
export const preloadFonts = (): void => {
  try {
    const fonts: string[] = ['Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800'];

    fonts.forEach((font: string) => {
      const link: HTMLLinkElement = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${font}&display=swap`;
      link.crossOrigin = 'anonymous';

      // Gestione errori per CSP
      link.onerror = () => {
        console.warn('Font loading blocked by CSP, using fallback fonts');
      };

      document.head.appendChild(link);
    });
  } catch (error) {
    console.warn('Font preloading failed, using system fonts:', error);
  }
};

// Font display optimization for better performance
export const optimizeFontDisplay = (): void => {
  try {
    const style: HTMLStyleElement = document.createElement('style');
    style.textContent = `
      /* Fallback font stack per migliore compatibilità */
      :root {
        --font-family-primary: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      body {
        font-family: var(--font-family-primary);
        font-display: swap;
      }
      
      /* Ottimizzazione caricamento font */
      .fonts-loaded {
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.warn('Font optimization failed:', error);
  }
};

// Initialize font loading with performance optimizations
export const initFontLoading = (): void => {
  try {
    // Preload critical fonts
    preloadFonts();

    // Optimize font display
    optimizeFontDisplay();

    // Add font loading class to body for progressive enhancement
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(() => {
          document.body.classList.add('fonts-loaded');
          console.log('✅ Fonts loaded successfully');
        })
        .catch(error => {
          console.warn('Font loading promise failed:', error);
          // Fallback: add class anyway after timeout
          setTimeout(() => {
            document.body.classList.add('fonts-loaded');
          }, 1000);
        });
    } else {
      // Fallback per browser che non supportano document.fonts
      setTimeout(() => {
        document.body.classList.add('fonts-loaded');
      }, 1000);
    }
  } catch (error) {
    console.warn('Font initialization failed:', error);
  }
};
