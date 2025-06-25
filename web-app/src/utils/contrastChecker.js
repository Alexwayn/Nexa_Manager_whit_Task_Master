/**
 * Color Contrast Checker and WCAG Compliance Utility
 * Provides tools for validating color contrast ratios and ensuring accessibility
 */

// WCAG 2.1 Standards
export const WCAG_STANDARDS = {
  AA: {
    NORMAL_TEXT: 4.5,
    LARGE_TEXT: 3.0,
    NON_TEXT: 3.0
  },
  AAA: {
    NORMAL_TEXT: 7.0,
    LARGE_TEXT: 4.5,
    NON_TEXT: 3.0
  }
};

// Color blindness simulation matrices
export const COLOR_BLINDNESS_MATRICES = {
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758]
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7]
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525]
  ]
};

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Calculate relative luminance according to WCAG
 */
export function getRelativeLuminance(rgb) {
  const { r, g, b } = rgb;
  
  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1, color2) {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsWCAGStandard(ratio, level = 'AA', textSize = 'normal') {
  const standard = WCAG_STANDARDS[level];
  if (!standard) return false;
  
  const threshold = textSize === 'large' ? standard.LARGE_TEXT : standard.NORMAL_TEXT;
  return ratio >= threshold;
}

/**
 * Get color from CSS property
 */
export function getComputedColor(element, property = 'color') {
  const style = window.getComputedStyle(element);
  const colorValue = style.getPropertyValue(property);
  
  // Convert RGB/RGBA to hex
  const rgbMatch = colorValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }
  
  // Convert hex
  if (colorValue.startsWith('#')) {
    return hexToRgb(colorValue);
  }
  
  return null;
}

/**
 * Audit element's color contrast
 */
export function auditElementContrast(element) {
  const foregroundColor = getComputedColor(element, 'color');
  const backgroundColor = getComputedColor(element, 'background-color');
  
  if (!foregroundColor || !backgroundColor) {
    return {
      element,
      error: 'Could not determine colors',
      passes: false
    };
  }
  
  const ratio = getContrastRatio(foregroundColor, backgroundColor);
  const fontSize = parseInt(window.getComputedStyle(element).fontSize);
  const fontWeight = window.getComputedStyle(element).fontWeight;
  
  // Determine if it's large text (18px+ or 14px+ bold)
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
  
  return {
    element,
    foregroundColor,
    backgroundColor,
    ratio: Math.round(ratio * 100) / 100,
    passes: {
      AA: meetsWCAGStandard(ratio, 'AA', isLargeText ? 'large' : 'normal'),
      AAA: meetsWCAGStandard(ratio, 'AAA', isLargeText ? 'large' : 'normal')
    },
    isLargeText,
    fontSize,
    recommendations: generateContrastRecommendations(ratio, isLargeText)
  };
}

/**
 * Generate recommendations for improving contrast
 */
export function generateContrastRecommendations(ratio, isLargeText) {
  const recommendations = [];
  const targetAA = isLargeText ? WCAG_STANDARDS.AA.LARGE_TEXT : WCAG_STANDARDS.AA.NORMAL_TEXT;
  const targetAAA = isLargeText ? WCAG_STANDARDS.AAA.LARGE_TEXT : WCAG_STANDARDS.AAA.NORMAL_TEXT;
  
  if (ratio < targetAA) {
    recommendations.push(`Contrast ratio ${ratio.toFixed(2)} fails WCAG AA standard (${targetAA} required)`);
    recommendations.push('Consider darkening text or lightening background');
  } else if (ratio < targetAAA) {
    recommendations.push(`Meets WCAG AA but fails AAA standard (${targetAAA} required for enhanced accessibility)`);
  } else {
    recommendations.push('Excellent contrast - meets all WCAG standards');
  }
  
  return recommendations;
}

/**
 * Audit all text elements on the page
 */
export function auditPageContrast() {
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label, input, textarea, select, li');
  const results = [];
  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    issues: []
  };
  
  textElements.forEach(element => {
    if (element.offsetParent !== null && element.textContent.trim()) { // Only visible elements with text
      const result = auditElementContrast(element);
      results.push(result);
      summary.total++;
      
      if (result.passes?.AA) {
        summary.passed++;
      } else {
        summary.failed++;
        summary.issues.push({
          element: element.tagName.toLowerCase(),
          text: element.textContent.slice(0, 50),
          ratio: result.ratio,
          selector: generateSelector(element)
        });
      }
    }
  });
  
  return {
    results,
    summary,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate CSS selector for element
 */
function generateSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim()).slice(0, 2);
    return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
  }
  
  return element.tagName.toLowerCase();
}

/**
 * Simulate color blindness
 */
export function simulateColorBlindness(rgb, type) {
  const matrix = COLOR_BLINDNESS_MATRICES[type];
  if (!matrix) return rgb;
  
  const { r, g, b } = rgb;
  
  return {
    r: Math.round(matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b),
    g: Math.round(matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b),
    b: Math.round(matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b)
  };
}

/**
 * Test color visibility for different types of color blindness
 */
export function testColorBlindnessAccessibility(color1, color2) {
  const types = ['protanopia', 'deuteranopia', 'tritanopia'];
  const results = {};
  
  types.forEach(type => {
    const sim1 = simulateColorBlindness(color1, type);
    const sim2 = simulateColorBlindness(color2, type);
    const ratio = getContrastRatio(sim1, sim2);
    
    results[type] = {
      ratio: Math.round(ratio * 100) / 100,
      passes: meetsWCAGStandard(ratio, 'AA', 'normal')
    };
  });
  
  return results;
}

/**
 * Suggest accessible color alternatives
 */
export function suggestAccessibleColors(baseColor, targetRatio = 4.5) {
  const suggestions = [];
  const base = typeof baseColor === 'string' ? hexToRgb(baseColor) : baseColor;
  
  // Generate darker variants
  for (let factor = 0.1; factor <= 0.9; factor += 0.1) {
    const darker = {
      r: Math.round(base.r * factor),
      g: Math.round(base.g * factor),
      b: Math.round(base.b * factor)
    };
    
    const ratio = getContrastRatio(base, darker);
    if (ratio >= targetRatio) {
      suggestions.push({
        color: rgbToHex(darker.r, darker.g, darker.b),
        rgb: darker,
        ratio: Math.round(ratio * 100) / 100,
        type: 'darker'
      });
      break;
    }
  }
  
  // Generate lighter variants
  for (let factor = 0.1; factor <= 0.9; factor += 0.1) {
    const lighter = {
      r: Math.round(Math.min(255, base.r + (255 - base.r) * factor)),
      g: Math.round(Math.min(255, base.g + (255 - base.g) * factor)),
      b: Math.round(Math.min(255, base.b + (255 - base.b) * factor))
    };
    
    const ratio = getContrastRatio(base, lighter);
    if (ratio >= targetRatio) {
      suggestions.push({
        color: rgbToHex(lighter.r, lighter.g, lighter.b),
        rgb: lighter,
        ratio: Math.round(ratio * 100) / 100,
        type: 'lighter'
      });
      break;
    }
  }
  
  return suggestions;
}

/**
 * Apply high contrast theme
 */
export function applyHighContrastMode(enable = true) {
  const root = document.documentElement;
  
  if (enable) {
    root.classList.add('high-contrast');
    root.style.setProperty('--text-contrast-ratio', '7');
    root.style.setProperty('--border-contrast-ratio', '3');
  } else {
    root.classList.remove('high-contrast');
    root.style.removeProperty('--text-contrast-ratio');
    root.style.removeProperty('--border-contrast-ratio');
  }
}

/**
 * Export audit results
 */
export function exportContrastAudit(results) {
  const data = {
    audit: results,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contrast-audit-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Real-time contrast monitoring
 */
export class ContrastMonitor {
  constructor(options = {}) {
    this.options = {
      threshold: 4.5,
      interval: 5000,
      autoFix: false,
      ...options
    };
    this.observer = null;
    this.isRunning = false;
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.observer = new MutationObserver(() => {
      this.checkNewElements();
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Initial check
    this.checkNewElements();
  }
  
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isRunning = false;
  }
  
  checkNewElements() {
    const elements = document.querySelectorAll('[data-contrast-check="false"], :not([data-contrast-check])');
    
    elements.forEach(element => {
      element.setAttribute('data-contrast-check', 'true');
      const result = auditElementContrast(element);
      
      if (!result.passes?.AA) {
        this.handleContrastFailure(element, result);
      }
    });
  }
  
  handleContrastFailure(element, result) {
    if (this.options.autoFix) {
      this.autoFixContrast(element, result);
    } else {
      // Add warning class
      element.classList.add('contrast-warning');
      console.warn('Contrast failure detected:', {
        element,
        ratio: result.ratio,
        required: 4.5
      });
    }
  }
  
  autoFixContrast(element, result) {
    const suggestions = suggestAccessibleColors(result.foregroundColor);
    if (suggestions.length > 0) {
      element.style.color = suggestions[0].color;
      console.log('Auto-fixed contrast for element:', element);
    }
  }
} 