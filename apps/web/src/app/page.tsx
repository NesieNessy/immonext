import { Header, Button, Icons } from '@/components/ui';
import { HomeClient } from './HomeClient';


export default function Home() {

 return (
    <HomeClient>
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
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
      </main>
    </div>
    </HomeClient>
  );
}
