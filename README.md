# DC Fish Ledger

A comprehensive Fish Store Accounting & Inventory Management System with authentication.

## Features

- 🔐 **Secure Login**: Authentication system with username/password protection
- 📊 **Dashboard**: Real-time overview of stock, sales, and inventory
- 📦 **Shipment Management**: Track incoming shipments with cost calculations
- 💰 **Sales Point**: Record sales with profit analysis
- 👥 **Staff Manager**: Manage staff and track payments
- ⚙️ **Store Configuration**: Configure overhead costs and turnover settings

## Login Credentials

- **Username**: `faisal`
- **Password**: `dc_fish_123`

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The static build will be generated in the `dist` folder, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn UI components
│   │   └── Login.jsx    # Login page component
│   ├── FishStoreApp.jsx # Main application component
│   ├── App.jsx          # Root component with auth logic
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── dist/                # Production build output
├── index.html           # HTML template
└── package.json         # Dependencies and scripts
```

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **shadcn UI** - UI component library (inspired)

## Authentication

The app uses localStorage to persist authentication state. Users must log in with valid credentials to access the main application.

## License

Private - All rights reserved
