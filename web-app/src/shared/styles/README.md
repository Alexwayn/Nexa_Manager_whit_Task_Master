# Shared Styles

This directory contains all shared styles for the Nexa Manager application, organized in a structured and maintainable way.

## Directory Structure

```
shared/styles/
├── index.css                 # Main entry point - imports all styles
├── globals/                  # Global styles and base configurations
│   └── index.css            # Global styles, base layer, accessibility
├── themes/                   # Theme-related styles
│   ├── variables.css        # CSS custom properties and theme variables
│   └── typography.css       # Typography system and font definitions
├── components/               # Component-specific styles
│   ├── buttons.css          # Button component styles
│   ├── cards.css            # Card component styles
│   ├── dashboard.css        # Dashboard-specific component styles
│   └── forms.css            # Form component styles
└── utilities/                # Utility classes and helpers
    ├── animations.css       # Animation utilities and keyframes
    ├── effects.css          # Visual effects (gradients, patterns, etc.)
    ├── layout.css           # Layout utilities (scrollbars, truncation, etc.)
    └── rtl.css              # Right-to-left language support
```

## Usage

The styles are automatically imported through the main `index.css` file in the src directory:

```css
/* Import shared styles */
@import './shared/styles/index.css';
```

## Key Features

### 🎨 **Theme System**
- CSS custom properties for consistent theming
- Dark mode support
- High contrast accessibility mode
- Font size scaling for accessibility

### 🧩 **Component Styles**
- Modular component-specific styles
- Consistent design system
- Reusable UI components (buttons, cards, forms)
- Dashboard-specific enhancements

### 🛠 **Utility Classes**
- Animation utilities and effects
- Layout helpers (scrollbars, text truncation)
- Visual effects (gradients, patterns, glass morphism)
- RTL language support

### ♿ **Accessibility**
- Screen reader support
- High contrast mode
- Reduced motion support
- Enhanced focus indicators
- ARIA state styling

### 🌍 **Internationalization**
- RTL (Right-to-Left) language support
- Proper text direction handling
- Localized layout adjustments

## Typography System

The application uses **Plus Jakarta Sans** as the primary font family with a carefully crafted typography scale:

- **Display Text**: For page titles and major headings
- **Body Text**: For general content with multiple weight options
- **UI Text**: For interface elements and navigation
- **Specialized Classes**: For specific use cases (KPI values, card titles, etc.)

## Best Practices

1. **Import Order**: Styles are imported in a specific order (variables → globals → components → utilities)
2. **Modular Organization**: Each file has a specific purpose and scope
3. **Consistent Naming**: CSS classes follow a consistent naming convention
4. **Accessibility First**: All styles consider accessibility requirements
5. **Performance**: Optimized for fast loading and rendering

## Maintenance

When adding new styles:

1. **Global styles** → Add to `globals/index.css`
2. **Theme variables** → Add to `themes/variables.css`
3. **Typography** → Add to `themes/typography.css`
4. **Component styles** → Create new file in `components/` or add to existing
5. **Utility classes** → Add to appropriate file in `utilities/`

Remember to update the main `index.css` file if you add new CSS files that need to be imported.