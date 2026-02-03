import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Building, 
  Lock, 
  Bell, 
  Shield, 
  Trash2,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Input,
  Alert
} from '../../components/shared';

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = () => {
    updateProfile(profileData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const changePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    // In a real app, this would call an API
    setError('');
    setSaved(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences.</p>
      </div>

      {saved && (
        <Alert type="success" message="Settings saved successfully!" />
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Full Name"
              value={profileData.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              icon={User}
            />
            <Input
              label="Email Address"
              type="email"
              value={profileData.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              icon={Mail}
            />
            <Input
              label="Company"
              value={profileData.company}
              onChange={(e) => handleProfileChange('company', e.target.value)}
              icon={Building}
            />

            <div className="flex justify-end">
              <Button variant="primary" icon={Save} onClick={saveProfile}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && <Alert type="error" message={error} onClose={() => setError('')} />}

              <div className="relative">
                <Input
                  label="Current Password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  icon={Lock}
                />
              </div>
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  icon={Lock}
                />
              </div>
              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  icon={Lock}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">Show passwords</span>
              </label>

              <div className="flex justify-end">
                <Button variant="primary" onClick={changePassword}>
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-800">Delete Account</h4>
                  <p className="text-sm text-red-600">Permanently delete your account and all data.</p>
                </div>
                <Button variant="danger" icon={Trash2}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[
                { id: 'newCandidate', label: 'New candidate submissions', desc: 'Get notified when a candidate completes an interview' },
                { id: 'sessionComplete', label: 'Session completed', desc: 'Get notified when all candidates have completed a session' },
                { id: 'weeklyReport', label: 'Weekly summary', desc: 'Receive a weekly summary of interview activity' },
                { id: 'marketing', label: 'Product updates', desc: 'Receive updates about new features and improvements' },
              ].map((item) => (
                <label key={item.id} className="flex items-start gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={item.id !== 'marketing'}
                    className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="primary" icon={Save}>
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
