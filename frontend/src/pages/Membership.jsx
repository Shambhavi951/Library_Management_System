import React from 'react';
import Topbar from '../components/Topbar.jsx';
import { useAuth } from '../context/authStore.js';

export default function Membership() {
  const { user } = useAuth();
  const currentPlan = user?.plan_name || 'STANDARD';

  return (
    <>
      <Topbar title="Membership Program" crumb="Library Membership Plans" />

      <div className="pulse-bulletin" style={{ marginBottom: '30px' }}>
        <div className="pulse-bulletin-title">MEMBERSHIP OVERVIEW</div>
        <div className="pulse-bulletin-body">
          {user ? `Greetings, ${user.first_name || 'Patron'}. You are currently enrolled in the ${currentPlan} plan. Review our membership offerings and exclusive benefits below.` : 'Review our membership offerings and exclusive benefits below.'}
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        
        {/* Standard Plan Card */}
        <div className={`card ${currentPlan === 'STANDARD' ? 'membership-active-card' : ''}`} style={{
          position: 'relative',
          padding: '30px',
          border: currentPlan === 'STANDARD' ? '2.5px solid var(--branch-accent)' : '1px solid var(--parchment-3)',
          background: currentPlan === 'STANDARD' ? 'var(--ivory)' : 'var(--parchment-2)',
          boxShadow: '0 4px 15px var(--shadow)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease'
        }}>
          {currentPlan === 'STANDARD' && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'var(--branch-accent)',
              color: 'var(--ivory)',
              fontSize: '10px',
              fontFamily: 'var(--font-caps)',
              padding: '4px 8px',
              letterSpacing: '0.12em',
              fontWeight: '700',
              borderRadius: '3px'
            }}>
              CURRENT PLAN
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-caps)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--ink-soft)', marginBottom: '8px' }}>STANDARD LEVEL</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontStyle: 'italic', fontWeight: 'bold', color: 'var(--brown-deep)', marginBottom: '14px' }}>Standard Plan</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '24px' }}>
              <span style={{ fontSize: '38px', fontWeight: '800', color: 'var(--ink)' }}>$299</span>
              <span style={{ fontSize: '14px', color: 'var(--ink-soft)', marginLeft: '4px' }}>/ month</span>
            </div>
            
            <hr style={{ border: 'none', borderBottom: '1px solid var(--parchment-3)', margin: '0 0 20px 0' }} />
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--green-moss)', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                3 Active Checkouts
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--green-moss)', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                5 Active Reservation Holds
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--green-moss)', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                24-Hour Hold Shelf Pickup Window
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--green-moss)', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                1 Custom Reading List
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink-soft)', textDecoration: 'line-through', opacity: 0.5 }}>
                <span style={{ marginRight: '10px', fontWeight: 'bold' }}>✕</span>
                Priority Queue Processing
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink-soft)', textDecoration: 'line-through', opacity: 0.5 }}>
                <span style={{ marginRight: '10px', fontWeight: 'bold' }}>✕</span>
                Cross-Branch Checkout Privilege
              </li>
            </ul>
          </div>
          
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--ink-soft)' }}>
              Standard access to resources.
            </span>
          </div>
        </div>

        {/* Premium Plan Card */}
        <div className={`card ${currentPlan === 'PREMIUM' ? 'membership-active-card' : ''}`} style={{
          position: 'relative',
          padding: '30px',
          border: currentPlan === 'PREMIUM' ? '2.5px solid var(--gold)' : '1px solid var(--parchment-3)',
          background: currentPlan === 'PREMIUM' ? 'var(--ivory)' : 'var(--parchment-2)',
          boxShadow: '0 8px 25px rgba(201, 169, 106, 0.15)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease'
        }}>
          {currentPlan === 'PREMIUM' ? (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'var(--gold)',
              color: 'var(--brown-deep)',
              fontSize: '10px',
              fontFamily: 'var(--font-caps)',
              padding: '4px 8px',
              letterSpacing: '0.12em',
              fontWeight: '700',
              borderRadius: '3px'
            }}>
              CURRENT PLAN
            </div>
          ) : (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(201, 169, 106, 0.1)',
              color: 'var(--gold)',
              border: '1px solid var(--gold-soft)',
              fontSize: '9px',
              fontFamily: 'var(--font-caps)',
              padding: '3px 6px',
              letterSpacing: '0.1em',
              fontWeight: '700',
              borderRadius: '3px'
            }}>
              RECOMMENDED
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-caps)', fontSize: '11px', letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: '8px', fontWeight: 'bold' }}>PREMIUM LEVEL</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontStyle: 'italic', fontWeight: 'bold', color: 'var(--brown-deep)', marginBottom: '14px' }}>Premium Plan</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '24px' }}>
              <span style={{ fontSize: '38px', fontWeight: '800', color: 'var(--ink)' }}>$799</span>
              <span style={{ fontSize: '14px', color: 'var(--ink-soft)', marginLeft: '4px' }}>/ month</span>
            </div>
            
            <hr style={{ border: 'none', borderBottom: '1px solid var(--parchment-3)', margin: '0 0 20px 0' }} />
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--gold)', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                8 Active Checkouts
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--gold)', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                15 Active Reservation Holds
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--gold)', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                72-Hour Hold Shelf Pickup Window
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--gold)', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                Priority Queue Processing
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--gold)', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                Cross-Branch Checkout Privilege
              </li>
              <li style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--ink)' }}>
                <span style={{ color: 'var(--gold)', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                10 Custom Reading Lists
              </li>
            </ul>
          </div>
          
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--gold)', fontWeight: 'bold' }}>
              VIP access to all system resources.
            </span>
          </div>
        </div>

      </div>

      <div className="card" style={{ marginTop: '30px', padding: '24px', textAlign: 'center', background: 'var(--ivory)' }}>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
          ❦ Plan billing is handled at your designated home library branch registry desk. Fees are billed monthly. ❦
        </p>
      </div>
    </>
  );
}
