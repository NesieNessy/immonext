"use client";

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Header, TextField, Tile, StickyActionBar } from '@/components/immonext-design';
import { AppNavigation } from '../../components/features/AppNavigation';
import profileData from '@/data/profile.json';

export default function SettingsPage() {
    const profile = profileData.user_profile;
    
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email_address: profile.email_address,
        phone_number: profile.phone_number,
        street: profile.address.street,
        postal_code: profile.address.postal_code,
        city: profile.address.city,
        country: profile.address.country,
        tax_identification_number: profile.tax_identification_number,
        subscription_model: profile.subscription_model,
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (!isEditing) setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData({
            first_name: profile.first_name,
            last_name: profile.last_name,
            email_address: profile.email_address,
            phone_number: profile.phone_number,
            street: profile.address.street,
            postal_code: profile.address.postal_code,
            city: profile.address.city,
            country: profile.address.country,
            tax_identification_number: profile.tax_identification_number,
            subscription_model: profile.subscription_model,
        });
        setIsEditing(false);
    };

    const handleSave = () => {
        // TODO: Implement save functionality
        console.log('Saving data:', formData);
        setIsEditing(false);
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Navigation Bar */}
            <AppNavigation />

            <main className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <Header
                    title="Benutzereinstellungen"
                    subtitle="Ihre persönlichen Daten und Kontoeinstellungen"
                />

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
                    {/* Personal & Contact Information */}
                    <Tile
                        title="Persönliche Informationen"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                            <TextField
                                label="Vorname"
                                value={formData.first_name}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                            />
                            <TextField
                                label="Nachname"
                                value={formData.last_name}
                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                            />
                            <TextField
                                label="E-Mail-Adresse"
                                value={formData.email_address}
                                type="email"
                                onChange={(e) => handleInputChange('email_address', e.target.value)}
                                className="sm:col-span-2"
                            />
                            <TextField
                                label="Telefonnummer"
                                value={formData.phone_number}
                                type="tel"
                                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                className="sm:col-span-2"
                            />
                        </div>
                    </Tile>

                    {/* Address Section */}
                    <Tile
                        title="Adresse"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                            <TextField
                                label="Straße & Hausnummer"
                                value={formData.street}
                                onChange={(e) => handleInputChange('street', e.target.value)}
                                className="sm:col-span-2"
                            />
                            <TextField
                                label="Postleitzahl"
                                value={formData.postal_code}
                                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                            />
                            <TextField
                                label="Stadt"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                            />
                            <TextField
                                label="Land"
                                value={formData.country}
                                onChange={(e) => handleInputChange('country', e.target.value)}
                                className="sm:col-span-2"
                            />
                        </div>
                    </Tile>

                    {/* Tax & Subscription Section */}
                    <Tile
                        title="Steuer & Abonnement"
                        className="lg:col-span-2"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                            <TextField
                                label="Steuer-ID"
                                value={formData.tax_identification_number}
                                onChange={(e) => handleInputChange('tax_identification_number', e.target.value)}
                            />
                            <TextField
                                label="Abonnement"
                                value={formData.subscription_model}
                                onChange={(e) => handleInputChange('subscription_model', e.target.value)}
                            />
                        </div>
                    </Tile>
                </div>
            </main>

            {/* Sticky Action Bar */}
            <StickyActionBar
                show={isEditing}
                onGhost={handleCancel}
                onPrimary={handleSave}
                ghostLabel="Abbrechen"
                primaryLabel="Speichern"
                ghostIcon={<X size={20} />}
                primaryIcon={<Save size={20} />}
            />
        </div>
    );
}
