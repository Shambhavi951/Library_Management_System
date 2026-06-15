import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../components/Topbar.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/authStore.js';
import { displayBranch } from '../utils/branches.js';

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboardData() {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role_type === 'MEMBER') {
        const [history, reservations, notifications, fines] = await Promise.all([
          api('/member/history'),
          api('/member/reservations'),
          api('/member/notifications'),
          api('/member/fines')
        ]);
        setData({ history, reservations, notifications, fines });
      } else if (user.role_type === 'ADMIN') {
        const [analytics, transfers, acquisitions, notifications] = await Promise.all([
          api('/admin/analytics'),
          api('/admin/transfers'),
          api('/admin/acquisitions'),
          api('/admin/notifications')
        ]);
        setData({ analytics, transfers, acquisitions, notifications });
      } else if (user.role_type === 'OWNER') {
        const [analytics, branches, members] = await Promise.all([
          api('/owner/analytics'),
          api('/catalog/branches'),
          api('/owner/members')
        ]);
        setData({ analytics, branches, members });
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  }

  const refreshMe = useAuth((s) => s.refreshMe);

  useEffect(() => {
    refreshMe();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <>
        <Topbar title="Dashboard" crumb="Branch-aware command center" />
        <div className="empty">
          <span className="empty-hint">LOADING RECORDS</span>
          Retrieving ledger files from shelves...
        </div>
      </>
    );
  }

  // --- MEMBER DASHBOARD ---
  if (user?.role_type === 'MEMBER') {
    const activeBorrows = data?.history?.filter(b => b.borrow_status === 'ACTIVE') || [];
    const activeHolds = data?.reservations?.filter(r => r.reservation_status === 'ON_HOLD') || [];
    const queuedReserves = data?.reservations?.filter(r => r.reservation_status === 'QUEUED') || [];
    const totalFines = data?.fines?.reduce((acc, curr) => acc + (curr.fine_amount || 0), 0) || 0;
    const recentNotifs = data?.notifications?.slice(0, 3) || [];
    
    // Reading challenge computations
    const completedBorrows = data?.history?.filter(b => b.borrow_status === 'RETURNED') || [];
    const challengeGoal = 12;
    const challengeProgress = Math.min(challengeGoal, completedBorrows.length);
    const challengePercent = Math.round((challengeProgress / challengeGoal) * 100);

    const stats = [
      { label: 'Books Borrowed', value: activeBorrows.length },
      { label: 'Ready for Pickup', value: activeHolds.length, highlight: activeHolds.length > 0 },
      { label: 'Hold Queue', value: queuedReserves.length },
      { label: 'Active Fines', value: `$${totalFines.toFixed(2)}`, alert: totalFines > 0 }
    ];

    const homeBranchName = displayBranch(user.branch_name || 'Fernhollow Branch');

    return (
      <>
        <Topbar title="Dashboard" crumb={`Welcome back, Patron`} />

        {totalFines > 0 && (
          <div className="fine-alert-bar">
            <span className="fine-alert-msg">
              <strong>Notice:</strong> You have outstanding fines of <strong>${totalFines.toFixed(2)}</strong>. Please visit the fines center to clear your balance.
            </span>
            <Link to="/fines" className="btn btn-sm btn-danger">Pay Fines</Link>
          </div>
        )}

        {/* Pulse Bulletin banner */}
        <div className="pulse-bulletin">
          <div className="pulse-bulletin-title">LIBRARY PULSE</div>
          <div className="pulse-bulletin-body">
            "A room without books is like a body without a soul." Seeding proper habits is the beginning of wisdom. View your active checkout catalog or search new arrivals below.
          </div>
        </div>

        {/* Stat Cards */}
        <section className="stat-grid">
          {stats.map((s, idx) => (
            <div 
              className={`stat ${s.alert ? 'tag-red' : s.highlight ? 'tag-gold' : ''}`} 
              key={idx}
              style={s.alert ? { borderColor: 'var(--rust)', background: 'rgba(138, 59, 34, 0.08)' } : {}}
            >
              <div className="stat-label" style={s.alert ? { color: 'var(--rust)' } : {}}>{s.label}</div>
              <div className="stat-value" style={s.alert ? { color: 'var(--rust)' } : {}}>{s.value}</div>
            </div>
          ))}
        </section>

        {/* Main Section Grid */}
        <div className="dashboard-grid">
          {/* Left Column: Logs & Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Holds Ready for Pickup */}
            {activeHolds.length > 0 && (
              <div className="card" style={{ borderColor: 'var(--gold)' }}>
                <div className="card-header">
                  <div>
                    <div className="card-sub" style={{ color: 'var(--gold)' }}>HOLD LOCKER</div>
                    <div className="card-title">Ready for Pickup</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activeHolds.map(hold => (
                    <div className="dashboard-list-item" key={hold.reservation_id}>
                      <div>
                        <div className="dashboard-list-title">{hold.title}</div>
                        <div className="dashboard-list-meta">Assigned Branch: {displayBranch(hold.branch_name)}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span className="badge-hold">READY</span>
                        <span style={{ fontSize: '11px', color: 'var(--green-deep)' }}>
                          Expires: {new Date(hold.hold_expiry).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Currently Borrowed Books */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-sub">CURRENT CHECKOUTS</div>
                  <div className="card-title">Currently Reading</div>
                </div>
              </div>
              {activeBorrows.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activeBorrows.map(b => {
                    const isOverdue = new Date() > new Date(b.due_date);
                    return (
                      <div className="dashboard-list-item" key={b.borrow_id}>
                        <div>
                          <div className="dashboard-list-title">{b.title}</div>
                          <div className="dashboard-list-meta">Copy #{b.copy_id} • From {displayBranch(b.branch_name)}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          {isOverdue ? (
                            <span className="badge-overdue">OVERDUE</span>
                          ) : (
                            <span className="status-pill ok">ACTIVE</span>
                          )}
                          <span style={{ fontSize: '11px', color: isOverdue ? 'var(--rust)' : 'var(--ink-soft)' }}>
                            Due: {new Date(b.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty" style={{ padding: '24px 0' }}>
                  <span className="empty-hint">NO CHECKOUTS</span>
                  Your shelf is empty. Go search the catalog to borrow books!
                </div>
              )}
            </div>

            {/* Recent Notifications / Alerts */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-sub">BULLETIN</div>
                  <div className="card-title">Recent Alerts</div>
                </div>
              </div>
              {recentNotifs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recentNotifs.map(n => (
                    <div className="dashboard-list-item" key={n.notification_id} style={n.read_status === 'N' ? { background: 'rgba(201, 169, 106, 0.05)' } : {}}>
                      <div>
                        <div className="dashboard-list-title" style={{ fontSize: '15px', fontWeight: n.read_status === 'N' ? '700' : '500' }}>{n.title}</div>
                        <div className="dashboard-list-meta" style={{ fontStyle: 'normal', color: 'var(--ink)' }}>{n.message_body}</div>
                        <div className="dashboard-list-meta" style={{ fontSize: '11px', marginTop: '4px' }}>{new Date(n.created_date).toLocaleString()}</div>
                      </div>
                      {n.read_status === 'N' && <span className="badge-hold" style={{ background: 'var(--green-moss)', color: '#fff', border: 'none' }}>NEW</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty" style={{ padding: '24px 0' }}>No recent alerts.</div>
              )}
            </div>
          </div>

          {/* Right Column: Reading Progress & Branch Spotlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Library Card Profile */}
            <div className="library-card">
              <div className="library-card-header">
                <div className="library-card-title">OFFICIAL CHECKOUT CARD</div>
                <div className="library-card-name">{user.first_name} {user.last_name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-dotted-row">
                  <span className="card-dotted-label">PATRON ID</span>
                  <div className="card-dotted-line"></div>
                  <span className="card-dotted-value">#{user.member_id || '-'}</span>
                </div>
                <div className="card-dotted-row">
                  <span className="card-dotted-label">MEMBER STATUS</span>
                  <div className="card-dotted-line"></div>
                  <span className="card-dotted-value" style={{ color: user.plan_name === 'PREMIUM' ? 'var(--gold)' : 'var(--ink)' }}>
                    {user.plan_name || 'STANDARD'}
                  </span>
                </div>
                <div className="card-dotted-row">
                  <span className="card-dotted-label">HOME BRANCH</span>
                  <div className="card-dotted-line"></div>
                  <span className="card-dotted-value">{homeBranchName}</span>
                </div>
                <div className="card-dotted-row">
                  <span className="card-dotted-label">PREFERRED BRANCH</span>
                  <div className="card-dotted-line"></div>
                  <span className="card-dotted-value">{displayBranch(user.branch_name)}</span>
                </div>
                <div className="card-dotted-row">
                  <span className="card-dotted-label">CORRESPONDENCE</span>
                  <div className="card-dotted-line"></div>
                  <span className="card-dotted-value" style={{ fontSize: '12px' }}>{user.email}</span>
                </div>
              </div>
              <div className="ornament" style={{ margin: '14px 0 0', fontSize: '16px' }}>❦</div>
            </div>

            {/* Reading Challenge Progress */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-sub">CHALLENGE</div>
                  <div className="card-title">2026 Reading Goal</div>
                </div>
              </div>
              <div style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Completed: <strong>{challengeProgress}</strong> / {challengeGoal} books</span>
                  <span style={{ fontWeight: '700', color: 'var(--green-deep)' }}>{challengePercent}%</span>
                </div>
                <div className="popularity-bar-container" style={{ height: '12px', borderRadius: '4px' }}>
                  <div 
                    className="popularity-bar-fill" 
                    style={{ 
                      width: `${challengePercent}%`, 
                      borderRadius: '3px',
                      background: 'linear-gradient(to right, var(--gold-soft), var(--green-moss))'
                    }}
                  ></div>
                </div>
                <p className="muted" style={{ fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
                  {challengeProgress >= challengeGoal 
                    ? "Congratulations! You have achieved your annual reading goal! 🏆" 
                    : "Borrow and return books to progress towards your annual goal."}
                </p>
              </div>
            </div>

            {/* Curator's choice spotlight */}
            <div className="card" style={{ background: 'var(--parchment-2)' }}>
              <div className="card-header">
                <div>
                  <div className="card-sub" style={{ color: 'var(--brown-deep)' }}>RECOMMENDED</div>
                  <div className="card-title">Curator's Spotlight</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontStyle: 'italic', fontSize: '20px', fontWeight: 'bold', color: 'var(--brown-deep)', marginBottom: '4px' }}>
                  "The Hobbit"
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                  By J.R.R. Tolkien
                </div>
                <p style={{ fontSize: '13px', fontStyle: 'italic', lineHeight: '1.4', margin: '4px 0 12px', color: 'var(--ink)' }}>
                  "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole... it was a hobbit-hole, and that means comfort."
                </p>
                <Link to="/catalog" className="btn btn-sm btn-primary">Find in Catalog</Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- ADMIN / OWNER DASHBOARD ---
  const summary = data?.analytics?.summary || {};
  const stats = Object.entries(summary).map(([label, value]) => ({
    label: label.replaceAll('_', ' '),
    value
  }));

  const branchName = displayBranch(user.branch_name || 'Central Library');

  return (
    <>
      <Topbar title="Dashboard" crumb={`${user.role_type} Command Center • ${branchName}`} />

      {/* Operations brief bulletin */}
      <div className="pulse-bulletin">
        <div className="pulse-bulletin-title">OPERATIONS BRIEF</div>
        <div className="pulse-bulletin-body">
          Welcome back to the Command Dashboard. Live monitoring is active for branch book checkouts, transfers, maintenance repairs, and queue priorities. Inspect logs or utilize quick services below.
        </div>
      </div>

      {/* Stat Grid */}
      <section className="stat-grid">
        {stats.map((s, idx) => (
          <div className="stat" key={idx}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </section>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Popularity / Demand charts */}
        <div className="card">
          {user.role_type === 'ADMIN' ? (
            <>
              <div className="card-header">
                <div>
                  <div className="card-sub">POPULAR TITLES</div>
                  <div className="card-title">Top Checkouts at Your Branch</div>
                </div>
              </div>
              {data?.analytics?.mostBorrowed?.length > 0 ? (
                <div style={{ padding: '6px 0' }}>
                  {data.analytics.mostBorrowed.map((book, idx) => {
                    const maxCount = data.analytics.mostBorrowed[0].borrow_count || 1;
                    const pct = Math.max(15, Math.round((book.borrow_count / maxCount) * 100));
                    return (
                      <div className="popularity-item" key={idx}>
                        <div className="popularity-info">
                          <span style={{ fontWeight: '600' }}>{book.title}</span>
                          <span className="muted">{book.borrow_count} borrowings</span>
                        </div>
                        <div className="popularity-bar-container">
                          <div className="popularity-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty" style={{ padding: '24px 0' }}>No checkout statistics accumulated yet.</div>
              )}
            </>
          ) : (
            <>
              <div className="card-header">
                <div>
                  <div className="card-sub">DEMAND INTELLIGENCE</div>
                  <div className="card-title">Acquisition Suggestion Requests</div>
                </div>
              </div>
              {data?.analytics?.demand?.length > 0 ? (
                <div style={{ padding: '6px 0' }}>
                  {data.analytics.demand.map((book, idx) => {
                    const maxCount = data.analytics.demand[0].request_count || 1;
                    const pct = Math.max(15, Math.round((book.request_count / maxCount) * 100));
                    return (
                      <div className="popularity-item" key={idx}>
                        <div className="popularity-info">
                          <span style={{ fontWeight: '600' }}>{book.requested_title}</span>
                          <span className="muted">{book.request_count} requests</span>
                        </div>
                        <div className="popularity-bar-container">
                          <div className="popularity-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty" style={{ padding: '24px 0' }}>No purchase recommendations from members yet.</div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Pending operations / Branch audit logs (Replaces the redundant Quick Tasks grid) */}
        <div className="card">
          {user.role_type === 'ADMIN' ? (
            <>
              <div className="card-header">
                <div>
                  <div className="card-sub">ACTION ITEMS</div>
                  <div className="card-title">Awaiting Branch Attention</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Active Transfers waiting */}
                {data?.transfers?.filter(t => ['REQUESTED', 'IN_TRANSIT'].includes(t.transfer_status)).length > 0 ? (
                  <div style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '10px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-caps)', color: 'var(--green-deep)' }}>TRANSFERS</span>
                    <p style={{ margin: '2px 0 0', fontSize: '14px' }}>
                      There are <strong>{data.transfers.filter(t => ['REQUESTED', 'IN_TRANSIT'].includes(t.transfer_status)).length}</strong> inter-branch transfers pending processing.
                    </p>
                    <Link to="/admin-transfers" style={{ fontSize: '12px', color: 'var(--gold)' }}>Resolve Transfers →</Link>
                  </div>
                ) : (
                  <div style={{ borderLeft: '3px solid var(--parchment-3)', paddingLeft: '10px', color: 'var(--ink-soft)' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-caps)' }}>TRANSFERS</span>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', fontStyle: 'italic' }}>No pending book transfers.</p>
                  </div>
                )}

                {/* Awaiting Approvals */}
                {data?.notifications?.filter(n => n.notification_type === 'BOOK_READY_ADMIN' && n.read_status !== 'Y').length > 0 ? (
                  <div style={{ borderLeft: '3px solid var(--green-moss)', paddingLeft: '10px', marginTop: '10px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-caps)', color: 'var(--green-deep)' }}>PICKUPS</span>
                    <p style={{ margin: '2px 0 0', fontSize: '14px' }}>
                      There are <strong>{data.notifications.filter(n => n.notification_type === 'BOOK_READY_ADMIN' && n.read_status !== 'Y').length}</strong> books ready for member checkout.
                    </p>
                    <Link to="/notifications" style={{ fontSize: '12px', color: 'var(--green-moss)' }}>View Approvals →</Link>
                  </div>
                ) : (
                  <div style={{ borderLeft: '3px solid var(--parchment-3)', paddingLeft: '10px', marginTop: '10px', color: 'var(--ink-soft)' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-caps)' }}>PICKUPS</span>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', fontStyle: 'italic' }}>No pending member pickups.</p>
                  </div>
                )}

                {/* Acquisitions */}
                {data?.acquisitions?.filter(a => a.request_status === 'REQUESTED').length > 0 ? (
                  <div style={{ borderLeft: '3px solid var(--rust)', paddingLeft: '10px', marginTop: '10px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-caps)', color: 'var(--rust)' }}>ACQUISITIONS</span>
                    <p style={{ margin: '2px 0 0', fontSize: '14px' }}>
                      There are <strong>{data.acquisitions.filter(a => a.request_status === 'REQUESTED').length}</strong> member request suggestions awaiting review.
                    </p>
                    <Link to="/acquisitions" style={{ fontSize: '12px', color: 'var(--rust)' }}>Review Suggestions →</Link>
                  </div>
                ) : (
                  <div style={{ borderLeft: '3px solid var(--parchment-3)', paddingLeft: '10px', marginTop: '10px', color: 'var(--ink-soft)' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-caps)' }}>ACQUISITIONS</span>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', fontStyle: 'italic' }}>No pending acquisitions.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="card-header">
                <div>
                  <div className="card-sub">AUDIT</div>
                  <div className="card-title">Network Distribution</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '14px' }}>
                  <span>Total Active Branches:</span> <strong style={{ float: 'right' }}>{data?.branches?.length || 0}</strong>
                </div>
                <div style={{ fontSize: '14px', borderTop: '1px solid var(--parchment-3)', paddingTop: '6px' }}>
                  <span>Total System Members:</span> <strong style={{ float: 'right' }}>{data?.members?.length || 0}</strong>
                </div>
                <div style={{ fontSize: '14px', borderTop: '1px solid var(--parchment-3)', paddingTop: '6px' }}>
                  <span>Inventory Copies:</span> <strong style={{ float: 'right' }}>{summary.copies || 0}</strong>
                </div>
                <div style={{ fontSize: '14px', borderTop: '1px solid var(--parchment-3)', paddingTop: '6px' }}>
                  <span>Pending Transfers:</span> <strong style={{ float: 'right' }}>{summary.transfers || 0}</strong>
                </div>
              </div>
              <div className="ornament" style={{ margin: '14px 0 0', fontSize: '16px' }}>❦</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
