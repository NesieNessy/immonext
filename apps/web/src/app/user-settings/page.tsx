"use client";

import { Header, StickyActionBar, TextField, Tile, useToast } from '@/components/ui';
import { authBypassUser, isAuthBypassEnabled } from '@/lib/authBypass';
import { supabase } from '@/lib/supabase/client.supabase';
import { getPersonalData, upsertPersonalData } from '@/lib/supabase/personal_data.supabase';
import type { PersonalData } from '@immonext/types';
import { Loader2, Save, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

const emptyForm = {
    firstName: '',
    lastName: '',
    emailAddress: '',
    phoneNumber: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    taxIdentificationNumber: '',
};

type FormData = typeof emptyForm;

function SettingsPageContent() {
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const isOnboarding = searchParams.get('onboarding') === '1';
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [formData, setFormData] = useState<FormData>(emptyForm);
    const [savedData, setSavedData] = useState<FormData>(emptyForm);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toFormData = (data: PersonalData): FormData => ({
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.emailAddress,
        phoneNumber: data.phoneNumber ?? '',
        street: data.street,
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        taxIdentificationNumber: data.taxIdentificationNumber,
    });

    const loadData = useCallback(async (uid: string) => {
        setIsLoading(true);
        setError(null);
        const data = await getPersonalData(uid);
        if (data) {
            const form = toFormData(data);
            setFormData(form);
            setSavedData(form);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isAuthBypassEnabled()) {
            setUser(authBypassUser);
            setFormData({
                ...emptyForm,
                firstName: 'ImmoNext',
                lastName: 'Dev User',
                emailAddress: authBypassUser.email ?? 'dev@immonext.local',
            });
            setSavedData({
                ...emptyForm,
                firstName: 'ImmoNext',
                lastName: 'Dev User',
                emailAddress: authBypassUser.email ?? 'dev@immonext.local',
            });
            setIsLoading(false);
            return;
        }

        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser(data.user);
                loadData(data.user.id);
            } else {
                setIsLoading(false);
            }
        });
    }, [loadData]);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (!isEditing) setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData(savedData);
        setIsEditing(false);
        setError(null);
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setError(null);
        const result = await upsertPersonalData({
            userId: user.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            emailAddress: formData.emailAddress,
            phoneNumber: formData.phoneNumber || undefined,
            street: formData.street,
            houseNumber: formData.houseNumber,
            postalCode: formData.postalCode,
            city: formData.city,
            taxIdentificationNumber: formData.taxIdentificationNumber,
        });

        if (result) {
            const updated = toFormData(result);
            setSavedData(updated);
            setFormData(updated);
            setIsEditing(false);
            showToast('Einstellungen gespeichert.');
        } else {
            setError('Fehler beim Speichern. Bitte versuchen Sie es erneut.');
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <main className="container mx-auto px-4 py-8">
                <Header
                    items={[{ label: 'Benutzereinstellungen' }]}
                />

                {isOnboarding && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                        Bitte vervollständigen Sie zunächst Ihre Benutzereinstellungen, bevor Sie ImmoNext nutzen können.
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <Tile title="Persönliche Informationen">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                            <TextField
                                label="Vorname"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                            />
                            <TextField
                                label="Nachname"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                            />
                            <TextField
                                label="E-Mail-Adresse"
                                value={formData.emailAddress}
                                type="email"
                                onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                                className="sm:col-span-2"
                            />
                            <TextField
                                label="Telefonnummer"
                                value={formData.phoneNumber}
                                type="tel"
                                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                className="sm:col-span-2"
                            />
                        </div>
                    </Tile>

                    {/* Address */}
                    <Tile title="Adresse">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                            <TextField
                                label="Straße"
                                value={formData.street}
                                onChange={(e) => handleInputChange('street', e.target.value)}
                            />
                            <TextField
                                label="Hausnummer"
                                value={formData.houseNumber}
                                onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                            />
                            <TextField
                                label="Postleitzahl"
                                value={formData.postalCode}
                                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                            />
                            <TextField
                                label="Stadt"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                            />
                        </div>
                    </Tile>

                    {/* Tax */}
                    <Tile title="Steuer" className="lg:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                            <TextField
                                label="Steueridentifikationsnummer"
                                value={formData.taxIdentificationNumber}
                                onChange={(e) => handleInputChange('taxIdentificationNumber', e.target.value)}
                            />
                        </div>
                    </Tile>
                </div>
            </main>

            <StickyActionBar
                show={true}
                onGhost={handleCancel}
                onPrimary={handleSave}
                ghostLabel="Zurück"
                primaryLabel="Einstellungen speichern"
                ghostIcon={<X size={20} />}
                primaryIcon={isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                primaryDisabled={!isEditing || isSaving}
            />
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={null}>
            <SettingsPageContent />
        </Suspense>
    );
}
