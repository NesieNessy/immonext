# ImmoNext - Real Estate Management Platform

A modern real estate management application built with React, Next.js, TypeScript, and Tailwind CSS.

## Features

- 👥 **Customer Management** - View customer information with contact details
- 🏘️ **Property Listings** - Browse property listings with detailed information
- 📊 **Dashboard** - Quick stats showing customers, properties, and total value
- 📁 **JSON Data Storage** - Simple JSON files for data (backend-ready)

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
immonext/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── CustomerCard.tsx  # Customer card component
│   │   └── PropertyCard.tsx  # Property card component
│   ├── data/
│   │   ├── customers.json    # Customer data
│   │   └── properties.json   # Property data
│   └── types/
│       └── index.ts          # TypeScript types
├── public/                   # Static assets
└── package.json
```

## Data Management

Edit the JSON files to add or modify data:
- `src/data/customers.json` - Customer information
- `src/data/properties.json` - Property listings

### Customer Data Structure
- ID, Name, Email, Phone, Address

### Property Data Structure
- ID, Title, Type, Price, Address, Bedrooms, Bathrooms, Area, Description

## Technologies

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT

