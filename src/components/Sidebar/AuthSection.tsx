import { LogIn, LogOut, User } from 'lucide-react';
import { initiateNotionAuth, signOut } from '../../lib/auth';
import useNotion from './useNotion';

interface AuthSectionProps {
  isAuthenticated: boolean;
  user: any;
  onAuthChange: () => void;
}

const AuthSection = ({ isAuthenticated, user, onAuthChange }: AuthSectionProps) => {
  const handleSignIn = () => {
    initiateNotionAuth();
  };

  const handleSignOut = async () => {
    await signOut();
    onAuthChange();
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-section">
        <button className="auth-button signin-button" onClick={handleSignIn}>
          <LogIn size={18} />
          <span>Sign in with Notion</span>
        </button>
        <p className="auth-hint">Connect your Notion workspace to get started</p>
      </div>
    );
  }

  return (
    <div className="auth-section authenticated">
      <div className="user-info">
        <div className="user-avatar">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} />
          ) : (
            <User size={20} />
          )}
        </div>
        <div className="user-details">
          <div className="user-name">{user?.name || 'User'}</div>
          {user?.person?.email && <div className="user-email">{user.person.email}</div>}
        </div>
      </div>
      <button className="auth-button signout-button" onClick={handleSignOut}>
        <LogOut size={16} />
      </button>
    </div>
  );
};

export default AuthSection;
