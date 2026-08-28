import { Header, PAGE_CONTAINER_CLASS, Button, Icons } from '@/components/ui';
import { HomeClient } from './HomeClient';


export default function Home() {

 return (
    <HomeClient>
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <main className={PAGE_CONTAINER_CLASS}>

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
