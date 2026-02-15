import { Customer } from '@/types';

interface CustomerCardProps {
  customer: Customer;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{customer.name}</h3>
      <div className="space-y-2 text-gray-600">
        <p className="flex items-center">
          <span className="font-medium mr-2">📧</span>
          <a href={`mailto:${customer.email}`} className="hover:text-blue-600">
            {customer.email}
          </a>
        </p>
        <p className="flex items-center">
          <span className="font-medium mr-2">📱</span>
          {customer.phone}
        </p>
        <p className="flex items-center">
          <span className="font-medium mr-2">🏠</span>
          {customer.address}
        </p>
      </div>
    </div>
  );
}
