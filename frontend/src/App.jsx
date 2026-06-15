import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Catalog from './pages/Catalog.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DataPage from './pages/DataPage.jsx';
import Layout from './components/Layout.jsx';
import Membership from './pages/Membership.jsx';
import Protected from './components/Protected.jsx';
import { useAuth } from './context/authStore.js';

const memberCols = ['title', 'branch_name', 'reservation_status', 'queue_position', 'estimated_wait_days'];
const inventoryCols = ['copy_id', 'title', 'branch_name', 'copy_status', 'copy_condition', 'floor_number', 'section_code', 'shelf_number', 'rack_number', 'position_number'];
const transferCols = ['transfer_id', 'title', 'source_branch', 'destination_branch', 'transfer_status'];
const acqCols = ['acquisition_request_id', 'requested_title', 'requested_author', 'branch_name', 'priority_level', 'request_status'];

const NotificationsRoute = () => {
  const { user } = useAuth();
  const endpoint = user?.role_type === 'MEMBER'
    ? '/member/notifications'
    : user?.role_type === 'ADMIN'
      ? '/admin/notifications'
      : '/owner/notifications';
  return <DataPage title="Notifications" endpoint={endpoint} columns={['notification_id', 'notification_type', 'title', 'message_body', 'read_status', 'created_date']} />;
};

const SettingsRoute = () => {
  const { user } = useAuth();
  const readOnly = user?.role_type === 'ADMIN';
  return <DataPage title="Settings" endpoint="/owner/settings" columns={[]} form={settingsForm} actionLabel="Save Settings" readOnly={readOnly} />;
};

const MembersRoute = () => {
  const { user } = useAuth();
  const endpoint = user?.role_type === 'OWNER' ? '/owner/members' : '/admin/members';
  return <DataPage title="Manage Members" endpoint={endpoint} columns={['member_id', 'first_name', 'last_name', 'email', 'phone_number', 'plan_name', 'home_branch_name', 'preferred_branch_name', 'password_hash']} form={memberForm} actionLabel="Create Member" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login/:type" element={<Login />} />
      <Route path="/catalog-public" element={<Catalog publicMode />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Protected roles={['ADMIN', 'OWNER']}><Register /></Protected>} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/borrow-center" element={<DataPage title="Borrow Center" endpoint="/member/history" columns={['borrow_id', 'title', 'branch_name', 'borrow_status', 'due_date', 'fine_amount']} />} />
        <Route path="/reservations" element={<DataPage title="Reservation Center" endpoint="/member/reservations" columns={memberCols} />} />
        <Route path="/transfers" element={<DataPage title="Transfers" endpoint="/member/transfers" columns={transferCols} form={transferForm} actionLabel="Request Transfer" noEdit />} />
        <Route path="/notifications" element={<NotificationsRoute />} />
        <Route path="/reading-lists" element={<DataPage title="Reading Lists" endpoint="/member/reading-lists" columns={['reading_list_id', 'list_name', 'visibility_status', 'item_count']} form={readingListForm} actionLabel="Create List" noEdit />} />
        <Route path="/reviews" element={<DataPage title="Reviews" endpoint="/member/reviews" columns={['review_id', 'publication_id', 'rating_value', 'review_text']} form={reviewForm} actionLabel="Submit Review" noEdit />} />
        <Route path="/acquisition-requests" element={<DataPage title="Acquisition Requests" endpoint="/member/acquisitions" columns={acqCols} form={acquisitionForm} actionLabel="Request Title" noEdit />} />
        <Route path="/fines" element={<DataPage title="Fines" endpoint="/member/fines" columns={['borrow_id', 'title', 'fine_amount', 'borrow_status', 'due_date']} />} />
        <Route path="/history" element={<DataPage title="History" endpoint="/member/history" columns={['borrow_id', 'title', 'branch_name', 'borrowed_date', 'returned_date', 'borrow_status', 'fine_amount']} />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/profile" element={<DataPage title="Profile" endpoint="/auth/me" columns={['email', 'role_type', 'branch_name', 'plan_name']} />} />
        <Route path="/inventory" element={<Protected roles={['ADMIN', 'OWNER']}><DataPage title="Inventory Management" endpoint="/admin/inventory" columns={inventoryCols} form={copyForm} actionLabel="Add Copy" /></Protected>} />
        <Route path="/publications" element={<Protected roles={['ADMIN', 'OWNER']}><DataPage title="Publications" endpoint="/admin/publications" columns={['publication_id', 'title', 'publication_year', 'publisher_name', 'language_name', 'isbn', 'page_count']} form={publicationForm} actionLabel="Add Publication" noEdit /></Protected>} />
        <Route path="/quality-checks" element={<Protected roles={['ADMIN', 'OWNER']}><DataPage title="Quality Checks" endpoint="/admin/quality-checks" columns={inventoryCols} form={qualityForm} actionLabel="Process Check" noEdit /></Protected>} />
        <Route path="/admin-transfers" element={<Protected roles={['ADMIN', 'OWNER']}><DataPage title="Transfers" endpoint="/admin/transfers" columns={transferCols} form={adminTransferForm} actionLabel="Update Transfer Status" method="PATCH" hideCreateForm /></Protected>} />
        <Route path="/acquisitions" element={<Protected roles={['ADMIN', 'OWNER']}><DataPage title="Acquisitions" endpoint="/admin/acquisitions" columns={acqCols} form={adminAcquisitionForm} actionLabel="Update Acquisition Status" method="PATCH" hideCreateForm /></Protected>} />
        <Route path="/admin-analytics" element={<Protected roles={['ADMIN', 'OWNER']}><DataPage title="Admin Analytics" endpoint="/admin/analytics" columns={['title', 'borrow_count']} /></Protected>} />
        <Route path="/owner-analytics" element={<Protected roles={['OWNER']}><DataPage title="Owner Analytics" endpoint="/owner/analytics" columns={['requested_title', 'request_count']} /></Protected>} />
        <Route path="/admins" element={<Protected roles={['OWNER']}><DataPage title="Manage Admins" endpoint="/owner/admins" columns={['account_id', 'username', 'email', 'branch_name', 'salary_amount', 'password_hash']} form={adminForm} actionLabel="Create Admin" /></Protected>} />
        <Route path="/members" element={<Protected roles={['ADMIN', 'OWNER']}><MembersRoute /></Protected>} />
        <Route path="/settings" element={<Protected roles={['OWNER', 'ADMIN']}><SettingsRoute /></Protected>} />
        <Route path="/branches" element={<Protected roles={['OWNER']}><DataPage title="Branches" endpoint="/catalog/branches" columns={['branch_id', 'branch_name', 'address_line', 'branch_status']} /></Protected>} />
      </Route>
    </Routes>
  );
}

const acquisitionForm = [{ name: 'title', label: 'Title' }, { name: 'author', label: 'Author' }, { name: 'isbn', label: 'ISBN' }, { name: 'preferred_branch_id', label: 'Preferred Branch Id', type: 'number', default: 1 }, { name: 'priority_level', label: 'Priority', options: [{ value: 'LOW', label: 'Low' }, { value: 'NORMAL', label: 'Normal' }, { value: 'HIGH', label: 'High' }] }];
const publicationForm = [{ name: 'title', label: 'Title' }, { name: 'publication_year', label: 'Year', type: 'number' }, { name: 'publisher_name', label: 'Publisher' }, { name: 'language_name', label: 'Language', default: 'English' }, { name: 'isbn', label: 'ISBN' }, { name: 'edition_name', label: 'Edition' }, { name: 'page_count', label: 'Pages', type: 'number' }];
const readingListForm = [{ name: 'list_name', label: 'List Name' }, { name: 'visibility_status', label: 'Visibility', options: [{ value: 'PRIVATE', label: 'Private' }, { value: 'PUBLIC', label: 'Public' }] }];
const reviewForm = [{ name: 'publication_id', label: 'Publication Id', type: 'number' }, { name: 'rating_value', label: 'Rating', type: 'number' }, { name: 'review_text', label: 'Review' }];
const upgradeForm = [{ name: 'plan_name', label: 'Plan', options: [{ value: 'STANDARD', label: 'Standard' }, { value: 'PREMIUM', label: 'Premium' }] }];
const copyForm = [{ name: 'publication_id', label: 'Publication Id', type: 'number' }, { name: 'branch_id', label: 'Branch Id', type: 'number', default: 1 }, { name: 'copy_number', label: 'Copy Number', type: 'number', default: 1 }, { name: 'floor_number', label: 'Floor', type: 'number', default: 1 }, { name: 'section_code', label: 'Section', default: 'AI' }, { name: 'shelf_number', label: 'Shelf', default: 'B12' }, { name: 'rack_number', label: 'Rack', default: 'C' }, { name: 'position_number', label: 'Position', default: '4' }];
const qualityForm = [{ name: 'copy_id', label: 'Copy Id', type: 'number' }, { name: 'condition', label: 'Condition', options: [{ value: 'GOOD', label: 'Good' }, { value: 'FAIR', label: 'Fair' }, { value: 'DAMAGED', label: 'Damaged' }, { value: 'LOST', label: 'Lost' }] }, { name: 'remarks', label: 'Remarks' }];
const transferForm = [{ name: 'copy_id', label: 'Copy Id', type: 'number' }, { name: 'destination_branch_id', label: 'Destination Branch Id', type: 'number' }];
const adminForm = [{ name: 'username', label: 'Username' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'password', label: 'Password', type: 'password' }, { name: 'branch_id', label: 'Branch Id', type: 'number', default: 1 }, { name: 'salary_amount', label: 'Salary', type: 'number' }, { name: 'hire_date', label: 'Hire Date', type: 'date' }];
const memberForm = [{ name: 'first_name', label: 'First Name' }, { name: 'last_name', label: 'Last Name' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'phone_number', label: 'Phone' }, { name: 'home_branch_id', label: 'Home Branch Id', type: 'number', default: 1 }, { name: 'preferred_branch_id', label: 'Preferred Branch Id', type: 'number', default: 1 }, { name: 'plan_name', label: 'Plan', options: [{ value: 'STANDARD', label: 'Standard' }, { value: 'PREMIUM', label: 'Premium' }] }, { name: 'password', label: 'Password', type: 'password' }];
const settingsForm = [{ name: 'fine_per_day', label: 'Fine Per Day', type: 'number' }, { name: 'premium_membership_cost', label: 'Premium Cost', type: 'number' }, { name: 'standard_membership_cost', label: 'Standard Cost', type: 'number' }, { name: 'standard_hold_hours', label: 'Standard Hold Hours', type: 'number' }, { name: 'premium_hold_hours', label: 'Premium Hold Hours', type: 'number' }];

const adminTransferForm = [{ name: 'transfer_status', label: 'Transfer Status', options: [{ value: 'REQUESTED', label: 'Requested' }, { value: 'APPROVED', label: 'Approved' }, { value: 'IN_TRANSIT', label: 'In Transit' }, { value: 'ARRIVED', label: 'Arrived' }, { value: 'SHELVED', label: 'Shelved' }, { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' }] }];
const adminAcquisitionForm = [{ name: 'request_status', label: 'Request Status', options: [{ value: 'REQUESTED', label: 'Requested' }, { value: 'UNDER_REVIEW', label: 'Under Review' }, { value: 'ORDERED', label: 'Ordered' }, { value: 'ARRIVED', label: 'Arrived' }, { value: 'CATALOGED', label: 'Cataloged' }, { value: 'AVAILABLE', label: 'Available' }, { value: 'REJECTED', label: 'Rejected' }] }];
