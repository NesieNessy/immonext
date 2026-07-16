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
          items={[{ label: 'Startseite' }]}
          actions={
            <>
              <Button variant="outline" size="sm" label="Filter" hideLabelOnMobile icon={<Icons.Filter />} />
              <Button variant="primary" size="sm" label="Add Customer" hideLabelOnMobile icon={<Icons.UserPlus />} />
            </>
          }
        />
      </main>
    </div>
    </HomeClient>
  );
}
