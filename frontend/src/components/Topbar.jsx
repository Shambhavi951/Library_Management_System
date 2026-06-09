import { useEffect, useState } from 'react';
import { useAuth } from '../context/authStore.js';
import { displayBranch } from '../utils/branches.js';
import { api } from '../api/client.js';

export default function Topbar({ title, crumb = 'The Reading Nook' }) {
  const { user, refreshMe } = useAuth();
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (user?.role_type === 'MEMBER' && user?.plan_name === 'PREMIUM') {
      api('/catalog/branches')
        .then(setBranches)
        .catch(console.error);
    }
  }, [user]);

  async function handleBranchChange(e) {
    const branchId = Number(e.target.value);
    try {
      await api('/member/switch-branch', {
        method: 'POST',
        body: { branch_id: branchId }
      });
      await refreshMe();
    } catch (err) {
      alert(err.message);
    }
  }

  const isPremiumMember = user?.role_type === 'MEMBER' && user?.plan_name === 'PREMIUM';

  return (
    <div className="topbar">
      <div>
        <div className="topbar-crumb">{crumb}</div>
        <div className="topbar-title">{title}</div>
      </div>
      <div className="topbar-right">
        {user?.plan_name && <span className="tag-pill tag-gold" style={{ marginRight: '8px' }}>{user.plan_name}</span>}
        <span className="tag-pill tag-gold">{user?.role_type || 'Guest'}</span>
        {isPremiumMember ? (
          <select 
            style={{ 
              padding: '4px 10px', 
              fontSize: '14px', 
              fontFamily: 'var(--font-display)', 
              background: 'var(--parchment-2)', 
              border: '1px solid var(--brown-warm)', 
              color: 'var(--brown-deep)', 
              fontStyle: 'italic',
              width: 'auto'
            }}
            value={user?.branch_id || ''} 
            onChange={handleBranchChange}
          >
            {branches.map((b) => (
              <option key={b.branch_id} value={b.branch_id}>
                {b.branch_name}
              </option>
            ))}
          </select>
        ) : (
          <span className="user-pill">
            <strong>{displayBranch(user?.branch_name || '') || 'All Branches'}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

