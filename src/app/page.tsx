import { Customer, Property } from '@/types';
import customersData from '@/data/customers.json';
import propertiesData from '@/data/properties.json';
import { Header, Tile, Button, Icons } from '@/components/real-estate';
import { AppNavigation } from '@/components/AppNavigation';

export default function Home() {
  const customers: Customer[] = customersData;
  const properties: Property[] = propertiesData;

  const totalValue = properties.reduce((sum, prop) => sum + prop.price, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <AppNavigation />
      
      <main className="container mx-auto px-4 py-8">

        {/* Page Header */}
        <Header
          title="🏡 ImmoNext"
          subtitle="Your Real Estate Management Platform"
          actions={
            <>
              <Button variant="outline" size="sm">
                <Icons.Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="primary" size="sm">
                <Icons.UserPlus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </>
          }
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          <Tile
            title="Total Customers"
            description="Active customer base"
            icon={<Icons.Users className="w-8 h-8" />}
          >
            <p className="text-3xl font-bold text-primary">{customers.length}</p>
          </Tile>
          <Tile
            title="Total Properties"
            description="Listed properties"
            icon={<Icons.Building2 className="w-8 h-8" />}
          >
            <p className="text-3xl font-bold text-primary">{properties.length}</p>
          </Tile>
          <Tile
            title="Total Value"
            description="Combined property value"
            icon={<Icons.DollarSign className="w-8 h-8" />}
          >
            <p className="text-3xl font-bold text-primary">
              ${totalValue.toLocaleString()}
            </p>
          </Tile>
        </div>

        {/* Customers Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Icons.Users className="w-6 h-6" />
              Customers
            </h2>
            <Button variant="ghost" size="sm">
              View All
              <Icons.ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <Tile
                key={customer.id}
                title={customer.name}
                description={customer.email}
                icon={<Icons.User className="w-6 h-6" />}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Icons.Phone className="w-4 h-4 mr-2" />
                    {customer.phone}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Icons.MapPin className="w-4 h-4 mr-2" />
                    {customer.address}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Icons.Mail className="w-4 h-4 mr-1" />
                    Contact
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Icons.Info className="w-4 h-4" />
                  </Button>
                </div>
              </Tile>
            ))}
          </div>
        </section>

        {/* Properties Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Icons.Building2 className="w-6 h-6" />
              Properties
            </h2>
            <Button variant="ghost" size="sm">
              View All
              <Icons.ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <Tile
                key={property.id}
                title={property.address}
                description={property.type}
                icon={<Icons.Home className="w-6 h-6" />}
              >
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Icons.Bed className="w-4 h-4 mr-1" />
                    {property.bedrooms}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Icons.Bath className="w-4 h-4 mr-1" />
                    {property.bathrooms}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Icons.Ruler className="w-4 h-4 mr-1" />
                    {property.area} sqft
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-2xl font-bold text-primary">
                    ${property.price.toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Icons.Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="primary" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </Tile>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
