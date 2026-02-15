# ImmoNext - Real Estate Management Platform

A modern real estate management application built with React, Next.js, TypeScript, and Tailwind CSS.

## Features

- 👥 **Customer Management**: View and manage customer information
- 🏘️ **Property Listings**: Display property listings with detailed information
- 📊 **JSON-based Data**: Uses JSON files for data storage (backend-ready)
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Project Structure

```
immonext/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main page component
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── CustomerCard.tsx  # Customer card component
│   │   └── PropertyCard.tsx  # Property card component
│   ├── data/
│   │   ├── customers.json    # Customer data
│   │   └── properties.json   # Property data
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── public/                   # Static assets
├── package.json
└── tsconfig.json
```

## Data Management

### Adding Customers and Properties

To add more customers or properties, simply edit the JSON files:
- `src/data/customers.json` - Customer information
- `src/data/properties.json` - Property listings

### Data Structure

**Customers:**
- ID, Name, Email, Phone, Address

**Properties:**
- ID, Title, Type, Price, Address, Bedrooms, Bathrooms, Area, Description

## Next Steps

- Add forms to create/edit customers and properties
- Implement search and filtering functionality
- Add detail pages for customers and properties
- Connect to a real backend API
- Add authentication and user management

## Technologies Used

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Turbopack** - Fast bundler

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

