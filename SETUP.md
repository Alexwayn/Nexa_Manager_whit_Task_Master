# Nexa Manager - Quick Setup Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Environment Setup (Optional)
If you want to use your own Supabase instance:
```bash
# Copy the example environment file
cp web-app/env.example web-app/.env.local

# Edit the .env.local file with your Supabase credentials
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (includes startup check) |
| `npm run build` | Build for production |
| `npm run check` | Run startup diagnostics |
| `npm run install-all` | Install all dependencies |
| `npm run clean` | Clean and reinstall dependencies |

## 🔧 Troubleshooting

### "Could not read package.json" Error
Make sure you're running commands from the project root directory, not from inside the `web-app` folder.

### Dependencies Issues
Try running:
```bash
npm run clean
```

### Environment Variables
The application includes fallback Supabase credentials for development. You can override these by creating a `.env.local` file in the `web-app` directory.

### Connection Issues
If you experience Supabase connection issues:
1. Check your internet connection
2. Verify your Supabase credentials (if using custom ones)
3. Check the browser console for detailed error messages

## 📁 Project Structure

```
├── web-app/           # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── lib/
│   ├── package.json
│   └── env.example
├── package.json       # Root package.json for easy command running
├── startup-check.js   # Startup diagnostics script
└── SETUP.md          # This file
```

## 🎯 Next Steps

1. **First Run**: Try running `npm run dev` to see if everything works
2. **Customize**: Update the Supabase configuration if needed
3. **Develop**: Start building your business management features

For more detailed information about the application features, check the `readme.md` file. 