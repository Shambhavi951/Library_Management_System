import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authStore.js';
import { branchClass, displayBranch } from '../utils/branches.js';

const memberNav = ['Dashboard', 'Catalog', 'Borrow Center', 'Reservations', 'Transfers', 'Notifications', 'Reading Lists', 'Reviews', 'Acquisition Requests', 'Fines', 'History', 'Membership', 'Profile'];
const adminNav = ['Dashboard', 'Inventory', 'Publications', 'Quality Checks', 'Transfers', 'Acquisitions', 'Admin Analytics', 'Manage Members', 'Settings', 'Notifications'];
const ownerNav = ['Dashboard', 'Owner Analytics', 'Manage Admins', 'Manage Members', 'Settings', 'Branches', 'Notifications'];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role_type === 'OWNER' ? ownerNav : user?.role_type === 'ADMIN' ? adminNav : memberNav;
  const branchName = displayBranch(user?.branch_name || user?.branch_id && 'Fernhollow Branch');
  return (
    <div className={`app-shell ${branchClass(branchName)}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">LIBRARY</div>
          <div className="brand-name">The Reading Nook</div>
          <div className="brand-sub">multi-branch intelligence</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">{user?.role_type}</div>
          {nav.map((item) => (
            <NavLink className="nav-btn" key={item} to={navPath(item, user?.role_type)}>{item}</NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>{branchName || 'Global'}</span>
          <button className="logout" onClick={() => { logout(); navigate('/'); }}>Exit</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function slug(text) {
  return text.toLowerCase().replaceAll(' ', '-');
}

function navPath(item, role) {
  if (role === 'ADMIN' && item === 'Transfers') return '/admin-transfers';
  if (item === 'Manage Members') return '/members';
  if (item === 'Manage Admins') return '/admins';
  return `/${slug(item)}`;
}
