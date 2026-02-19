interface DemoProperty {
  id: number;
  title: string;
  type: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
}

interface PropertyCardProps {
  property: DemoProperty;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-800">{property.title}</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {property.type}
          </span>
        </div>
        <p className="text-2xl font-bold text-green-600 mb-3">
          ${property.price.toLocaleString()}
        </p>
        <p className="text-gray-600 mb-4">{property.description}</p>
        <div className="space-y-2 text-sm text-gray-600">
          <p className="flex items-center">
            <span className="font-medium mr-2">📍</span>
            {property.address}
          </p>
          <div className="flex gap-4">
            <p className="flex items-center">
              <span className="font-medium mr-1">🛏️</span>
              {property.bedrooms} beds
            </p>
            <p className="flex items-center">
              <span className="font-medium mr-1">🚿</span>
              {property.bathrooms} baths
            </p>
            <p className="flex items-center">
              <span className="font-medium mr-1">📐</span>
              {property.area} sq ft
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
