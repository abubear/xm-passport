'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSelector from '@/components/ui/LanguageSelector';

const AVAILABLE_IPS = [
  'DC Comics', 'Marvel', 'Transformers', 'Star Wars', 'Harry Potter',
  'Lord of the Rings', 'Game of Thrones', 'Anime', 'Horror', 'Gaming',
  'Batman', 'Superman', 'Wonder Woman', 'Spider-Man', 'Iron Man',
  'X-Men', 'Avengers', 'Justice League', 'Venom', 'Joker',
];

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [selectedIPs, setSelectedIPs] = useState<string[]>([]);
  const [publicProfile, setPublicProfile] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    twitter: '',
    youtube: '',
    website: '',
  });

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          const u = data.user;
          setDisplayName(u.display_name || '');
          setBio(u.bio || '');
          setLocation(u.location || '');
          try { setSelectedIPs(JSON.parse(u.collection_prefs || '[]')); } catch { setSelectedIPs([]); }
          setPublicProfile(!!u.public_profile);
          try { setSocialLinks(JSON.parse(u.social_links || '{}')); } catch { setSocialLinks({ instagram: '', twitter: '', youtube: '', website: '' }); }
        }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const toggleIP = (ip: string) => {
    setSelectedIPs((prev) =>
      prev.includes(ip) ? prev.filter((i) => i !== ip) : [...prev, ip]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          location,
          collection_prefs: JSON.stringify(selectedIPs),
          public_profile: publicProfile ? 1 : 0,
          social_links: JSON.stringify(socialLinks),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Save failed');
        return;
      }

      setSuccess('Profile updated');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="xm-container py-6">
        <div className="space-y-4">
          <div className="h-8 w-48 shimmer rounded-lg" />
          <div className="h-24 shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="xm-container py-6 space-y-6 page-content">
      <h1 className="text-xl font-bold">Edit Profile</h1>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-3 text-green-400 text-sm">{success}</div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-400">Basic Info</h2>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Display Name</label>
            <input
              type="text"
              className="xm-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Bio</label>
            <textarea
              className="xm-input min-h-[80px] resize-none"
              placeholder="Tell other collectors about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
            />
            <p className="text-[10px] text-gray-600 mt-1">{bio.length}/300</p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Location</label>
            <input
              type="text"
              className="xm-input"
              placeholder="City, Country"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        {/* Collection Preferences */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400">Collection Preferences</h2>
          <p className="text-xs text-gray-500">Select IPs you collect</p>

          <div className="flex flex-wrap gap-2">
            {AVAILABLE_IPS.map((ip) => (
              <button
                key={ip}
                type="button"
                onClick={() => toggleIP(ip)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedIPs.includes(ip)
                    ? 'bg-xm-gold/20 border-xm-gold/40 text-xm-gold'
                    : 'bg-xm-card border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {selectedIPs.includes(ip) ? '✓ ' : ''}{ip}
              </button>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400">Social Links</h2>

          {(['instagram', 'twitter', 'youtube', 'website'] as const).map((platform) => (
            <div key={platform}>
              <label className="text-xs text-gray-500 mb-1 block capitalize">{platform}</label>
              <input
                type="text"
                className="xm-input"
                placeholder={platform === 'website' ? 'https://' : `@${platform}`}
                value={socialLinks[platform]}
                onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
              />
            </div>
          ))}
        </div>

        {/* Language */}
        <LanguageSelector />

        {/* Privacy */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400">Privacy</h2>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm">Public Profile</p>
              <p className="text-xs text-gray-500">Other collectors can find and view your profile</p>
            </div>
            <button
              type="button"
              onClick={() => setPublicProfile(!publicProfile)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                publicProfile ? 'bg-xm-gold' : 'bg-gray-700'
              }`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                publicProfile ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </label>
        </div>

        {/* Save */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="xm-btn-secondary flex-1 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="xm-btn-primary flex-1 text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
