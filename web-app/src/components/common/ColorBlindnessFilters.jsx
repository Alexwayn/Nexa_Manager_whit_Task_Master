import React from 'react';

/**
 * ColorBlindnessFilters Component
 * Provides SVG filters for simulating different types of color blindness
 * These filters are used by the CSS classes for color blindness simulation
 */
const ColorBlindnessFilters = () => {
  return (
    <svg
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <defs>
        {/* Protanopia (Red-blind) Filter */}
        <filter id="protanopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.567 0.433 0 0 0
                    0.558 0.442 0 0 0
                    0 0.242 0.758 0 0
                    0 0 0 1 0"
          />
        </filter>

        {/* Deuteranopia (Green-blind) Filter */}
        <filter id="deuteranopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.625 0.375 0 0 0
                    0.7 0.3 0 0 0
                    0 0.3 0.7 0 0
                    0 0 0 1 0"
          />
        </filter>

        {/* Tritanopia (Blue-blind) Filter */}
        <filter id="tritanopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.95 0.05 0 0 0
                    0 0.433 0.567 0 0
                    0 0.475 0.525 0 0
                    0 0 0 1 0"
          />
        </filter>

        {/* Protanomaly (Red-weak) Filter */}
        <filter id="protanomaly-filter">
          <feColorMatrix
            type="matrix"
            values="0.817 0.183 0 0 0
                    0.333 0.667 0 0 0
                    0 0.125 0.875 0 0
                    0 0 0 1 0"
          />
        </filter>

        {/* Deuteranomaly (Green-weak) Filter */}
        <filter id="deuteranomaly-filter">
          <feColorMatrix
            type="matrix"
            values="0.8 0.2 0 0 0
                    0.258 0.742 0 0 0
                    0 0.142 0.858 0 0
                    0 0 0 1 0"
          />
        </filter>

        {/* Tritanomaly (Blue-weak) Filter */}
        <filter id="tritanomaly-filter">
          <feColorMatrix
            type="matrix"
            values="0.967 0.033 0 0 0
                    0 0.733 0.267 0 0
                    0 0.183 0.817 0 0
                    0 0 0 1 0"
          />
        </filter>

        {/* Achromatopsia (Total color blindness) Filter */}
        <filter id="achromatopsia-filter">
          <feColorMatrix
            type="matrix"
            values="0.299 0.587 0.114 0 0
                    0.299 0.587 0.114 0 0
                    0.299 0.587 0.114 0 0
                    0 0 0 1 0"
          />
        </filter>

        {/* Achromatomaly (Blue cone monochromacy) Filter */}
        <filter id="achromatomaly-filter">
          <feColorMatrix
            type="matrix"
            values="0.618 0.320 0.062 0 0
                    0.163 0.775 0.062 0 0
                    0.163 0.320 0.516 0 0
                    0 0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  );
};

export default ColorBlindnessFilters; 