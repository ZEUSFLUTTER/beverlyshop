'use client';

import React from 'react';
import { ProfileSettings } from '@/components/settings/ProfileSettings';

export default function CommercantProfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Mon compte</h2>
        <p className="text-muted text-sm">Modifiez vos informations et votre mot de passe.</p>
      </div>
      <ProfileSettings />
    </div>
  );
}
