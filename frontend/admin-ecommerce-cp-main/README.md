# Admin Dashboard - Ecommerce CP

A modern admin dashboard for managing an ecommerce platform with customizable products. Built with Next.js 15, TypeScript, Ant Design, and Zustand.

## Features

- 🎨 **Modern UI**: Built with Ant Design components
- 🌓 **Dark/Light Theme**: Toggle between light and dark modes
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔐 **Authentication**: JWT-based authentication with auto-refresh
- 📊 **Dashboard**: Overview with statistics and recent activities
- 🛍️ **Product Management**: CRUD operations for products and variations
- 📦 **Order Management**: View and manage customer orders
- 👥 **User Management**: Manage customer accounts
- ⭐ **Review Management**: Approve/reject product reviews
- 🚚 **Shipping & Payment**: Configure shipping methods and payment options
- ⚙️ **Settings**: Admin profile and system configuration

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: Ant Design 5
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS + Ant Design
- **Icons**: Ant Design Icons

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/           # Reusable components
│   ├── layout/          # Layout components (Sidebar, Header)
│   ├── dashboard/       # Dashboard-specific components
│   ├── products/        # Product management components
│   ├── orders/          # Order management components
│   ├── users/           # User management components
│   ├── reviews/         # Review management components
│   └── common/          # Common/shared components
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   └── useTheme.ts      # Theme management hook
├── services/            # API services
│   ├── api.ts           # Base API configuration
│   ├── auth.ts          # Authentication API
│   ├── products.ts      # Products API
│   ├── orders.ts        # Orders API
│   └── users.ts         # Users API
├── types/               # TypeScript type definitions
│   ├── api.ts           # API response types
│   ├── auth.ts          # Authentication types
│   ├── product.ts       # Product types
│   ├── order.ts         # Order types
│   ├── review.ts        # Review types
│   └── common.ts        # Common types
└── utils/               # Utility functions
    └── constants.ts     # App constants
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- FastAPI backend running on `http://127.0.0.1:8000`

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd admin-cp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Setup

Make sure your FastAPI backend is running on `http://127.0.0.1:8000` with the following endpoints available:

- Authentication: `/auth/login`, `/auth/logout`, `/auth/refresh`
- Users: `/users/me`, `/users/admin-only`
- Products: `/products/`
- Orders: `/orders/`
- Reviews: `/reviews/`
- Categories: `/categories/`
- Shipping: `/shipping/`
- Payment: `/payment/`

## Configuration

### API Base URL

Update the API base URL in `src/utils/constants.ts`:

```typescript
export const API_BASE_URL = 'http://127.0.0.1:8000';
```

### Theme Configuration

The app supports both light and dark themes. Theme settings are automatically saved to localStorage.

### Authentication

The app uses JWT tokens stored in localStorage with automatic refresh functionality.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features Implementation Status

### ✅ Completed
- [x] Project setup and configuration
- [x] Authentication system with JWT
- [x] Dark/Light theme toggle
- [x] Responsive layout with sidebar and header
- [x] Dashboard overview with statistics
- [x] Navigation and routing
- [x] TypeScript types for all API endpoints
- [x] Base API service with interceptors

### 🚧 In Progress
- [ ] Product management (CRUD operations)
- [ ] Order management and status updates
- [ ] User management interface
- [ ] Review approval system
- [ ] File upload functionality
- [ ] Data tables with filtering and pagination

### 📋 Planned
- [ ] Advanced analytics and charts
- [ ] Bulk operations
- [ ] Export functionality
- [ ] Real-time notifications
- [ ] Advanced search and filters
- [ ] Role-based permissions
- [ ] Audit logs

## API Integration

The admin dashboard is designed to work with a FastAPI backend. All API calls are handled through service classes in the `src/services/` directory.

### Authentication Flow

1. User logs in with email/password
2. Backend returns JWT access and refresh tokens
3. Tokens are stored in localStorage
4. Access token is automatically added to all API requests
5. Token is automatically refreshed when expired

### Error Handling

- Network errors are handled globally
- Authentication errors trigger automatic logout
- User-friendly error messages are displayed
- Loading states are shown during API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
