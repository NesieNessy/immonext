import CustomerCard from '@/components/CustomerCard';
import PropertyCard from '@/components/PropertyCard';
import { Customer, Property } from '@/types';
import customersData from '@/data/customers.json';
import propertiesData from '@/data/properties.json';

export default function Home() {
  const customers: Customer[] = customersData;
  const properties: Property[] = propertiesData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🏡 ImmoNext
          </h1>
          <p className="text-xl text-gray-600">
            Your Real Estate Management Platform
          </p>
        </div>

        {/* Customers Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-3">👥</span>
            Customers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        </section>

        {/* Properties Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-3">🏘️</span>
            Properties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
