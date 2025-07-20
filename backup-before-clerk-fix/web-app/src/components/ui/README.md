# Nexa Manager Visual System & Component Library

This document outlines the comprehensive visual system implemented for Nexa Manager, including typography, spacing, colors, and reusable UI components.

## 🎨 Design Foundation

### Typography
Our typography system is built on the **Inter** font family with a rem-based scale for consistency and accessibility.

#### Font Hierarchy
- **Page Titles**: `text-page-title` (2.25rem/36px, font-bold)
- **Page Subtitles**: `text-page-subtitle` (1.5rem/24px, font-semibold)
- **Section Titles**: `text-section-title` (1.25rem/20px, font-semibold)
- **Card Titles**: `text-card-title` (1.125rem/18px, font-semibold)
- **Body Text**: `text-body` (1rem/16px, font-normal)
- **Metrics**: `text-metric-large` (2rem/32px, font-bold)
- **Labels**: `text-label` (0.875rem/14px, font-medium)
- **Captions**: `text-caption` (0.75rem/12px, font-normal)

### Color System
Semantic color classes for consistent text styling:

- **Primary Text**: `text-primary` - Main content (gray-900)
- **Secondary Text**: `text-secondary` - Supporting content (gray-600)
- **Tertiary Text**: `text-tertiary` - Less important content (gray-500)
- **Muted Text**: `text-muted` - Disabled/placeholder text (gray-400)
- **Interactive Text**: `text-interactive` - Links and interactive elements (blue-600)
- **Success Text**: `text-success` - Success states (green-600)
- **Warning Text**: `text-warning` - Warning states (yellow-600)
- **Error Text**: `text-error` - Error states (red-600)

### Spacing System
Based on an 8px grid system for consistent layouts:

- **Base unit**: 8px
- **Available sizes**: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 (in rem units)
- **Usage**: `space-4` = 1rem (16px), `space-8` = 2rem (32px)

## 📦 Component Library

### Typography Components

#### Heading
```jsx
import { Heading } from '@components/ui';

<Heading variant="page-title">Dashboard</Heading>
<Heading variant="section-title" as="h2">Recent Activity</Heading>
```

#### Text
```jsx
import { Text } from '@components/ui';

<Text variant="body" color="secondary">
  This is body text with secondary color
</Text>
<Text variant="caption" color="muted">
  This is caption text
</Text>
```

#### Metric
```jsx
import { Metric } from '@components/ui';

<Metric variant="large">$12,345</Metric>
```

### Button Components

#### Button
```jsx
import { Button } from '@components/ui';
import { PlusIcon } from '@heroicons/react/24/outline';

<Button variant="primary" size="default">
  Create Invoice
</Button>
<Button variant="secondary" icon={PlusIcon}>
  Add Item
</Button>
```

#### IconButton
```jsx
import { IconButton } from '@components/ui';
import { TrashIcon } from '@heroicons/react/24/outline';

<IconButton variant="danger" icon={TrashIcon} />
```

### Card Components

#### Basic Card
```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui';

<Card>
  <CardHeader>
    <CardTitle>Invoice Summary</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

#### Stat Card
```jsx
import { StatCard } from '@components/ui';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

<StatCard
  title="Total Revenue"
  value="$45,231"
  subtitle="This month"
  trend={{ type: 'positive', value: '+12%', label: 'from last month' }}
  icon={CurrencyDollarIcon}
  iconColor="text-green-600"
  iconBg="bg-green-50"
/>
```

### Form Components

#### Input
```jsx
import { Input, FormField } from '@components/ui';

<FormField label="Email" required error={errors.email}>
  <Input
    type="email"
    placeholder="Enter your email"
    error={!!errors.email}
  />
</FormField>
```

#### Select
```jsx
import { Select, FormField } from '@components/ui';

<FormField label="Status">
  <Select placeholder="Select status">
    <option value="draft">Draft</option>
    <option value="sent">Sent</option>
    <option value="paid">Paid</option>
  </Select>
</FormField>
```

### Layout Components

#### Stack (Vertical Spacing)
```jsx
import { Stack } from '@components/ui';

<Stack spacing={6}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>
```

#### Inline (Horizontal Spacing)
```jsx
import { Inline } from '@components/ui';

<Inline spacing={4} align="center">
  <Button>Cancel</Button>
  <Button variant="primary">Save</Button>
</Inline>
```

#### Grid
```jsx
import { Grid } from '@components/ui';

<Grid cols={3} gap={6}>
  <StatCard {...stat1} />
  <StatCard {...stat2} />
  <StatCard {...stat3} />
</Grid>
```

## 🚀 Migration Guide

### Step 1: Update Imports
Replace existing component imports with the new UI components:

```jsx
// Before
import { Button } from './components/Button';

// After
import { Button } from '@components/ui';
```

### Step 2: Update Typography
Replace hardcoded text styles with semantic variants:

```jsx
// Before
<h1 className="text-3xl font-bold text-gray-900">
  Dashboard
</h1>

// After
<Heading variant="page-title">
  Dashboard
</Heading>
```

### Step 3: Update Spacing
Replace arbitrary spacing with the grid system:

```jsx
// Before
<div className="space-y-5">

// After
<Stack spacing={6}>
```

### Step 4: Update Colors
Replace hardcoded colors with semantic classes:

```jsx
// Before
<p className="text-gray-600">

// After
<Text color="secondary">
```

## 🎯 Best Practices

### Typography
- Use semantic variants instead of hardcoded sizes
- Maintain consistent line heights for readability
- Use appropriate font weights for hierarchy

### Spacing
- Stick to the 8px grid system
- Use Stack/Inline components for consistent spacing
- Prefer semantic spacing over arbitrary values

### Colors
- Use semantic color classes for text
- Maintain sufficient contrast ratios (4.5:1 minimum)
- Test colors in both light and dark contexts

### Components
- Compose complex UIs from simple components
- Use appropriate variants for different contexts
- Leverage the `cn()` utility for conditional styling

## 🔧 Customization

To extend the system, update the Tailwind configuration:

```js
// tailwind.config.cjs
module.exports = {
  theme: {
    extend: {
      fontSize: {
        'custom-size': ['1.5rem', { lineHeight: '2rem' }],
      },
      spacing: {
        'custom': '2.5rem',
      },
    },
  },
};
```

## 📱 Responsive Design

All components are built with responsive design in mind:

```jsx
<Heading 
  variant="page-title" 
  className="text-page-subtitle md:text-page-title"
>
  Responsive Title
</Heading>
```

## ♿ Accessibility

- All components follow WCAG 2.1 guidelines
- Proper semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast ratios

---

**Note**: This visual system is designed to be scalable and maintainable. Always prefer using the provided components and utilities over custom implementations to ensure consistency across the application.