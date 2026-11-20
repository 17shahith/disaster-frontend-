import { UserCog } from 'lucide-react';
import CrudPage from '../../components/common/CrudPage';
import StatusBadge from '../../components/common/StatusBadge';
import userService from '../../services/userService';
import useAuth from '../../hooks/useAuth';
import { ROLE_LABELS, ROLE_OPTIONS, USER_STATUS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

const FORM_FIELDS = [
  { name: 'name', label: 'Full name', required: true, minLength: 3, col: 6 },
  { name: 'email', label: 'Email', type: 'email', required: true, col: 6, autoComplete: 'off' },
  { name: 'phone', label: 'Phone', type: 'tel', col: 6 },
  { name: 'role', label: 'Role', type: 'select', options: ROLE_OPTIONS, required: true, col: 6 },
  { name: 'status', label: 'Account status', type: 'select', options: USER_STATUS, required: true, col: 6 },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    minLength: 8,
    col: 6,
    autoComplete: 'new-password',
    help: 'Required for new users. Leave blank when editing to keep the current password.',
  },
];

const columns = [
  {
    key: 'name',
    label: 'User',
    render: (u) => (
      <div className="d-flex align-items-center gap-2">
        <span className="avatar avatar--sm">{u.name?.charAt(0)}</span>
        <div>
          <div className="fw-semibold">{u.name}</div>
          <div className="small text-muted">{u.email}</div>
        </div>
      </div>
    ),
  },
  { key: 'role', label: 'Role', render: (u) => ROLE_LABELS[u.role] || u.role },
  { key: 'phone', label: 'Phone', render: (u) => u.phone || '—' },
  { key: 'status', label: 'Status', render: (u) => <StatusBadge value={u.status} tone={u.status === 'Active' ? 'success' : 'neutral'} /> },
  { key: 'createdAt', label: 'Created', render: (u) => <span className="small">{formatDateTime(u.createdAt)}</span> },
];

const detailFields = [
  { label: 'Name', key: 'name' },
  { label: 'Email', key: 'email' },
  { label: 'Role', render: (u) => ROLE_LABELS[u.role] },
  { label: 'Phone', render: (u) => u.phone || '—' },
  { label: 'Status', render: (u) => <StatusBadge value={u.status} tone={u.status === 'Active' ? 'success' : 'neutral'} /> },
  { label: 'Created', render: (u) => formatDateTime(u.createdAt) },
];

export default function UsersPage() {
  const { user } = useAuth();
  return (
    <CrudPage
      module="users"
      title="User Management"
      subtitle="Manage control room accounts and role-based access"
      icon={UserCog}
      entityName="User"
      createLabel="Add User"
      service={userService}
      columns={columns}
      searchKeys={['id', 'name', 'email', 'phone']}
      searchPlaceholder="Search users by name or email…"
      filters={[
        { key: 'role', label: 'roles', options: ROLE_OPTIONS },
        { key: 'status', label: 'statuses', options: USER_STATUS },
      ]}
      formFields={FORM_FIELDS}
      defaultValues={{ status: 'Active', role: 'OPERATOR' }}
      toFormValues={(u) => ({ ...u, password: '' })}
      validate={(v) => {
        if (!v.id && !v.password) return { password: 'Password is required for new users' };
        if (v.id === user?.id && v.role !== user.role) return { role: 'You cannot change your own role' };
        if (v.id === user?.id && v.status !== 'Active') return { status: 'You cannot deactivate your own account' };
        return {};
      }}
      toPayload={({ password, ...rest }) => (password ? { ...rest, password } : rest)}
      detailFields={detailFields}
    />
  );
}
