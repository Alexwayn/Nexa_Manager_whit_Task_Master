# Motiff MCP Server Setup Guide

## Overview

The Motiff MCP (Model Context Protocol) server has been configured in your project to enable AI-powered design-to-code generation. This allows you to paste Motiff design URLs and have AI generate React components based on the designs.

## Configuration

The Motiff MCP server has been added to the following configuration files:

- `.windsurf/mcp.json` - For Windsurf IDE
- `.roo/mcp.json` - For Roo Code IDE  
- `.cursor/mcp.json` - For Cursor IDE

### Configuration Details

```json
{
  "mcpServers": {
    "motiff": {
      "command": "npx",
      "args": ["-y", "@motiff/mcp-server"]
    }
  }
}
```

## Prerequisites

1. **Node.js**: Ensure Node.js version 18 or higher is installed
2. **Motiff Account**: You need access to Motiff designs
3. **IDE Restart**: Restart your IDE after configuration

## How to Use

### Step 1: Access Motiff Design
1. Open your Motiff file
2. Toggle Develop Mode (Shift + D)
3. Navigate to **Main menu** → **Help and account** → **Motiff MCP Server**

### Step 2: Get Design URL
1. Select the frame you want to convert to code
2. Copy the Motiff frame URL

### Step 3: Generate Code with AI
1. Open your IDE's AI chat
2. Paste the Motiff frame URL
3. Provide instructions like:
   - "Help me create a React component based on this design"
   - "Generate a responsive component for this Motiff frame"
   - "Create a TypeScript component with proper styling"

### Example Usage

```
I have this Motiff design: [paste Motiff URL]

Please create a React component that:
- Matches the design exactly
- Uses Tailwind CSS for styling
- Is responsive for mobile and desktop
- Includes proper TypeScript types
```

## Features

- **High-Fidelity HTML Export**: Motiff exports designs as HTML for better AI understanding
- **Automatic Design Data Retrieval**: AI automatically fetches design data from Motiff
- **React Component Generation**: Optimized for React/Next.js projects
- **Responsive Design Support**: AI can adapt designs for different screen sizes

## Troubleshooting

### MCP Server Not Working
1. Restart your IDE
2. Check Node.js version (must be 18+)
3. Verify the MCP configuration is correct
4. Check IDE console for error messages

### Generated Code Differs from Design
- **Complex Designs**: Simplify the design or export smaller sections
- **Too Many Layers**: Reduce the number of layers in the frame
- **AI Model Limitations**: Try using a more advanced AI model

### Context Length Issues
- Export smaller sections of the design
- Break complex frames into smaller components
- Focus on specific UI elements rather than entire pages

## Best Practices

1. **Start Small**: Begin with simple components before complex layouts
2. **Clear Instructions**: Provide specific requirements for styling and functionality
3. **Iterative Approach**: Generate base components and refine them
4. **Design Preparation**: Organize Motiff layers clearly before export

## Integration with Project

The Motiff MCP server works seamlessly with your existing project structure:

- Generated components can be placed in `web-app/src/components/`
- Styling integrates with your Tailwind CSS setup
- Components follow your existing TypeScript patterns
- Translations can be added using your i18n setup

## Memory Integration

The AI assistant will remember your preference for using Motiff designs and can automatically suggest using the MCP tools when you mention design-related tasks.
